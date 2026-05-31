from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.db import get_db
from ..business.user_business import UserBusiness
from ..utils.response import success_response, error_response

router = APIRouter(prefix="/api/user", tags=["用户"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = ""
    nickname: Optional[str] = ""

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

def get_current_user(token: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    payload = UserBusiness.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="登录已过期")
    user = UserBusiness.get_user_by_id(db, payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = UserBusiness.authenticate(db, req.username, req.password)
    if not user:
        return error_response("用户名或密码错误")
    token = UserBusiness.create_token(user.id, user.username)
    return success_response({
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "avatar": user.avatar,
            "role": user.role
        }
    }, "登录成功")

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    user = UserBusiness.create_user(db, req.username, req.password, req.email, req.nickname)
    if not user:
        return error_response("用户名已存在")
    return success_response({"id": user.id}, "注册成功")

@router.get("/info")
def get_user_info(current_user = Depends(get_current_user)):
    return success_response({
        "id": current_user.id,
        "username": current_user.username,
        "nickname": current_user.nickname,
        "email": current_user.email,
        "avatar": current_user.avatar,
        "role": current_user.role,
        "created_at": current_user.created_at
    })

@router.put("/password")
def update_password(req: UpdatePasswordRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not UserBusiness.verify_password(req.old_password, current_user.password):
        return error_response("原密码错误")
    UserBusiness.update_user(db, current_user.id, password=req.new_password)
    return success_response(None, "密码修改成功")

@router.put("/profile")
def update_profile(req: UpdateProfileRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    update_data = {}
    if req.nickname is not None:
        update_data["nickname"] = req.nickname
    if req.email is not None:
        update_data["email"] = req.email
    if req.avatar is not None:
        update_data["avatar"] = req.avatar
    if update_data:
        UserBusiness.update_user(db, current_user.id, **update_data)
    return success_response(None, "资料更新成功")

@router.get("/stats")
def get_user_stats(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = UserBusiness.get_user_stats(db, current_user.id)
    return success_response(stats)

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), limit: int = 20):
    leaderboard = UserBusiness.get_leaderboard(db, limit)
    return success_response(leaderboard)

@router.get("/list")
def get_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100, current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    users = UserBusiness.get_users(db, skip, limit)
    return success_response([{
        "id": u.id,
        "username": u.username,
        "nickname": u.nickname,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at
    } for u in users])

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if UserBusiness.delete_user(db, user_id):
        return success_response(None, "删除成功")
    return error_response("用户不存在")
