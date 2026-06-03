from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user, create_access_token
from model.kl_model.schemas.user import UserCreate, UserLogin, UserUpdate, Token, PasswordChange
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserBusiness.get_user_by_username(db, username=user.username)
    if db_user:
        return error_response(code=400, message="用户名已存在")
    db_user = UserBusiness.get_user_by_email(db, email=user.email)
    if db_user:
        return error_response(code=400, message="邮箱已注册")
    
    user = UserBusiness.create_user(db=db, user=user)
    access_token = create_access_token(data={"sub": str(user.id)})
    return success_response(data=Token(access_token=access_token, user=user))


@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = UserBusiness.authenticate_user(db, user_login.username, user_login.password)
    if not user:
        return error_response(code=401, message="用户名或密码错误")
    access_token = create_access_token(data={"sub": str(user.id)})
    return success_response(data=Token(access_token=access_token, user=user))


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return success_response(data=current_user)


@router.put("/me")
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_user = UserBusiness.update_user(db, current_user.id, user_update)
    return success_response(data=updated_user)


@router.post("/change-password")
def change_password(
    request: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = UserBusiness.change_password(db, current_user.id, request.old_password, request.new_password)
    if not user:
        return error_response(code=400, message="旧密码错误")
    return success_response(message="密码修改成功")


@router.get("/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = UserBusiness.get_user(db, user_id=user_id)
    if db_user is None:
        return error_response(code=404, message="用户不存在")
    return success_response(data=db_user)


@router.get("")
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = UserBusiness.get_users(db, skip=skip, limit=limit)
    return success_response(data=users)
