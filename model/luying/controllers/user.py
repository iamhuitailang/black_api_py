from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import UserCreate, UserLogin, UserUpdate, success_response, error_response
from business import user as user_business

router = APIRouter(prefix="/api/user", tags=["用户管理"])


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if not user.username or not user.password:
        return error_response("用户名和密码不能为空")
    existing = user_business.get_user_by_username(db, user.username)
    if existing:
        return error_response("用户名已存在")
    db_user = user_business.create_user(db, user)
    return success_response(user_business.user_to_dict(db_user), "注册成功")


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    if not user.username or not user.password:
        return error_response("用户名和密码不能为空")
    db_user = user_business.authenticate_user(db, user.username, user.password)
    if not db_user:
        return error_response("用户名或密码错误")
    if db_user.status != 1:
        return error_response("账号已被禁用")
    token = f"token_{db_user.id}_{db_user.username}"
    return success_response({
        "token": token,
        "user": user_business.user_to_dict(db_user)
    }, "登录成功")


@router.get("/info")
def get_user_info(user_id: int, db: Session = Depends(get_db)):
    db_user = user_business.get_user_by_id(db, user_id)
    if not db_user:
        return error_response("用户不存在")
    follow_stats = user_business.get_user_follow_stats(db, user_id)
    data = user_business.user_to_dict(db_user)
    data.update(follow_stats)
    return success_response(data)


@router.put("/update")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = user_business.update_user(db, user_id, user_update)
    if not db_user:
        return error_response("用户不存在")
    return success_response(user_business.user_to_dict(db_user), "更新成功")


@router.get("/list")
def get_user_list(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = user_business.get_user_list(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [user_business.user_to_dict(u) for u in result["items"]]
    })


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = user_business.delete_user(db, user_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")
