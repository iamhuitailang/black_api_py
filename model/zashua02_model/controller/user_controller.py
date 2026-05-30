from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from ..business import UserBusiness

router = APIRouter(prefix="/zashua02/user", tags=["zashua02-user"])


def get_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    try:
        return int(token.split("_")[0])
    except:
        return None


class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateUserRequest(BaseModel):
    nickname: Optional[str] = None
    character_type: Optional[str] = None


@router.post("/register")
def register(req: RegisterRequest):
    return UserBusiness.register(req.username, req.password, req.nickname)


@router.post("/login")
def login(req: LoginRequest):
    return UserBusiness.login(req.username, req.password)


@router.get("/current/get")
def get_current(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    return UserBusiness.get_user(user_id)


@router.post("/password/change")
def change_password(req: ChangePasswordRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    return UserBusiness.change_password(user_id, req.old_password, req.new_password)


@router.post("/update")
def update_user(req: UpdateUserRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    kwargs = {k: v for k, v in req.dict().items() if v is not None}
    return UserBusiness.update_user(user_id, **kwargs)


@router.get("/list")
def list_users(page: int = 1, page_size: int = 20):
    return UserBusiness.list_users(page, page_size)


@router.delete("/{user_id}")
def delete_user(user_id: int):
    return UserBusiness.delete_user(user_id)
