from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.user_business import UserBusiness
from model.feixingqi_model.utils import success_response, error_response, ResponseModel
from typing import Optional

router = APIRouter(prefix="/api/feixingqi/user", tags=["飞行棋-用户"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str

class UpdateUserRequest(BaseModel):
    user_id: int
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None
    score: Optional[int] = None

@router.post("/login", response_model=ResponseModel)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = UserBusiness.authenticate(db, req.username, req.password)
    if not user:
        return error_response(401, "用户名或密码错误")
    user_data = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "role": user.role,
        "score": user.score,
        "level": user.level,
        "exp": user.exp,
        "wins": user.wins,
        "losses": user.losses
    }
    return success_response(user_data, "登录成功")

@router.post("/register", response_model=ResponseModel)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = UserBusiness.get_user_by_username(db, req.username)
    if existing:
        return error_response(400, "用户名已存在")
    user = UserBusiness.create_user(db, req.username, req.password, req.nickname)
    from model.feixingqi_model.business.item_business import ItemBusiness
    ItemBusiness.add_user_item(db, user.id, 1, 3)
    ItemBusiness.add_user_item(db, user.id, 3, 2)
    user_data = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "role": user.role
    }
    return success_response(user_data, "注册成功")

@router.post("/update-password", response_model=ResponseModel)
def update_password(req: UpdatePasswordRequest, db: Session = Depends(get_db)):
    user = UserBusiness.get_user_by_id(db, req.user_id)
    if not user:
        return error_response(404, "用户不存在")
    from model.feixingqi_model.utils import hash_password
    if user.password != hash_password(req.old_password):
        return error_response(400, "原密码错误")
    if hash_password(req.new_password) == user.password:
        return error_response(400, "新密码不能与原密码相同")
    UserBusiness.update_user(db, req.user_id, password=req.new_password)
    return success_response(None, "密码修改成功")

@router.post("/update", response_model=ResponseModel)
def update_user(req: UpdateUserRequest, db: Session = Depends(get_db)):
    user = UserBusiness.update_user(db, req.user_id, nickname=req.nickname, avatar=req.avatar, role=req.role, score=req.score)
    if not user:
        return error_response(404, "用户不存在")
    user_data = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "role": user.role,
        "score": user.score
    }
    return success_response(user_data, "更新成功")

@router.get("/{user_id}", response_model=ResponseModel)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserBusiness.get_user_by_id(db, user_id)
    if not user:
        return error_response(404, "用户不存在")
    user_data = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "role": user.role,
        "score": user.score,
        "level": user.level,
        "exp": user.exp,
        "wins": user.wins,
        "losses": user.losses,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
    return success_response(user_data)

@router.get("", response_model=ResponseModel)
def list_users(page: int = 1, page_size: int = 10, keyword: str = None, db: Session = Depends(get_db)):
    users, total = UserBusiness.get_user_list(db, page, page_size, keyword)
    user_list = []
    for user in users:
        user_list.append({
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "role": user.role,
            "score": user.score,
            "level": user.level,
            "wins": user.wins,
            "losses": user.losses,
            "status": user.status,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    return success_response({
        "list": user_list,
        "total": total,
        "page": page,
        "page_size": page_size
    })

@router.delete("/{user_id}", response_model=ResponseModel)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = UserBusiness.delete_user(db, user_id)
    if not success:
        return error_response(404, "用户不存在")
    return success_response(None, "删除成功")

@router.post("/{user_id}/status", response_model=ResponseModel)
def update_user_status(user_id: int, status: int, db: Session = Depends(get_db)):
    user = UserBusiness.update_user(db, user_id, status=status)
    if not user:
        return error_response(404, "用户不存在")
    return success_response(None, "状态更新成功")
