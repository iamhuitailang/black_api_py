from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from model.pet_model.core.database import get_db
from model.pet_model.core.response import success, error, page_result
from model.pet_model.schemas.user import UserCreate, UserUpdate, UserLogin, UserResponse
from model.pet_model.business.user_business import (
    create_user,
    authenticate_user,
    get_user,
    get_user_list,
    update_user,
    delete_user,
    get_user_by_username,
    get_user_by_phone,
)

router = APIRouter(prefix="/user", tags=["用户管理"])


@router.post("/register", summary="用户注册")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user.username):
        return error("用户名已存在")
    if get_user_by_phone(db, user.phone):
        return error("手机号已存在")
    db_user = create_user(db, user)
    return success(db_user, "注册成功")


@router.post("/login", summary="用户登录")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.username, user.password)
    if not db_user:
        return error("用户名或密码错误")
    if db_user.status == 0:
        return error("账号已被禁用")
    return success(db_user, "登录成功")


@router.get("/detail/{user_id}", summary="获取用户详情")
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    db_user = get_user(db, user_id)
    if not db_user:
        return error("用户不存在")
    return success(db_user)


@router.get("/list", summary="获取用户列表")
def get_users(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[int] = None,
    db: Session = Depends(get_db),
):
    users, total = get_user_list(db, page, page_size, keyword, role, status)
    return page_result(users, total, page, page_size)


@router.put("/update/{user_id}", summary="更新用户信息")
def update_user_info(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = update_user(db, user_id, user_update)
    if not db_user:
        return error("用户不存在")
    return success(db_user, "更新成功")


@router.delete("/delete/{user_id}", summary="删除用户")
def delete_user_info(user_id: int, db: Session = Depends(get_db)):
    result = delete_user(db, user_id)
    if not result:
        return error("用户不存在")
    return success(None, "删除成功")
