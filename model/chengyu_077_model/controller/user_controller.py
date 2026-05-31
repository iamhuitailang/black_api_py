from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    UserCreate, 
    UserLogin, 
    UserUpdate, 
    UserChangePassword,
    UserResponse,
    Token
)
from utils.response import ResponseModel, success_response, error_response
from business.user_business import (
    get_user,
    get_users,
    create_user,
    authenticate_user,
    update_user,
    change_password,
    delete_user,
    create_access_token,
    get_current_user,
    get_user_by_username
)
from models import User

router = APIRouter(prefix="/api/user", tags=["用户管理"])


@router.post("/register", response_model=ResponseModel[UserResponse])
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = create_user(db, user=user)
        return success_response(db_user, "注册成功")
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(code=500, message=f"注册失败: {str(e)}")


@router.post("/login", response_model=ResponseModel[Token])
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        return error_response(code=401, message="用户名或密码错误")
    
    access_token = create_access_token(data={"sub": user.username})
    token_data = Token(access_token=access_token, user=user)
    return success_response(token_data, "登录成功")


@router.get("/me", response_model=ResponseModel[UserResponse])
def read_users_me(current_user: User = Depends(get_current_user)):
    return success_response(current_user, "获取成功")


@router.put("/me", response_model=ResponseModel[UserResponse])
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_user = update_user(db, user_id=current_user.id, user_update=user_update)
    if not updated_user:
        return error_response(code=404, message="用户不存在")
    return success_response(updated_user, "更新成功")


@router.post("/change-password", response_model=ResponseModel)
def change_user_password(
    password_data: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        change_password(db, user_id=current_user.id, password_data=password_data)
        return success_response(message="密码修改成功")
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(code=500, message=f"密码修改失败: {str(e)}")


@router.get("/{user_id}", response_model=ResponseModel[UserResponse])
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return error_response(code=404, message="用户不存在")
    return success_response(db_user, "获取成功")


@router.get("/", response_model=ResponseModel[List[UserResponse]])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = get_users(db, skip=skip, limit=limit)
    return success_response(users, "获取成功")


@router.delete("/{user_id}", response_model=ResponseModel)
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    success = delete_user(db, user_id=user_id)
    if not success:
        return error_response(code=404, message="用户不存在")
    return success_response(message="删除成功")
