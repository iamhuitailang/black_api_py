from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..business.user_business import UserBusiness
from ..utils import json_response, decode_access_token

router = APIRouter(prefix="/api/user", tags=["user"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    nickname: Optional[str] = None


class UpdateUserRequest(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class SetCharacterRequest(BaseModel):
    character_id: int


class SetLevelRequest(BaseModel):
    level_id: int


def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    user = UserBusiness.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    result = UserBusiness.login(db, request.username, request.password)
    if not result:
        return json_response(code=401, message="用户名或密码错误")
    return json_response(data=result)


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = UserBusiness.get_user_by_username(db, request.username)
    if existing:
        return json_response(code=400, message="用户名已存在")
    user = UserBusiness.create_user(
        db, request.username, request.password, request.email, request.nickname
    )
    return json_response(data={
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname
    })


@router.get("/info")
def get_user_info(token: str, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        return json_response(data={
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "avatar": user.avatar,
            "current_character_id": user.current_character_id,
            "current_level_id": user.current_level_id
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.put("/update")
def update_user(token: str, request: UpdateUserRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        updated = UserBusiness.update_user(
            db, user.id,
            nickname=request.nickname,
            email=request.email,
            avatar=request.avatar
        )
        return json_response(data={
            "id": updated.id,
            "nickname": updated.nickname,
            "email": updated.email,
            "avatar": updated.avatar
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/change-password")
def change_password(token: str, request: ChangePasswordRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        success = UserBusiness.change_password(
            db, user.id, request.old_password, request.new_password
        )
        if not success:
            return json_response(code=400, message="原密码错误")
        return json_response(message="密码修改成功")
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/set-character")
def set_character(token: str, request: SetCharacterRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        updated = UserBusiness.set_current_character(db, user.id, request.character_id)
        return json_response(data={"current_character_id": updated.current_character_id})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/set-level")
def set_level(token: str, request: SetLevelRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        updated = UserBusiness.set_current_level(db, user.id, request.level_id)
        return json_response(data={"current_level_id": updated.current_level_id})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/list")
def list_users(token: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        users = UserBusiness.list_users(db, skip, limit)
        return json_response(data=[{
            "id": u.id,
            "username": u.username,
            "nickname": u.nickname,
            "email": u.email,
            "is_active": u.is_active
        } for u in users])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.delete("/{user_id}")
def delete_user(token: str, user_id: int, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        success = UserBusiness.delete_user(db, user_id)
        if not success:
            return json_response(code=404, message="用户不存在")
        return json_response(message="删除成功")
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)
