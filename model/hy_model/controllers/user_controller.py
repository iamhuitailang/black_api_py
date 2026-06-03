from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import UserUpdate, ResponseModel, UserResponse, PaginatedResponse
from services import UserService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = UserService.get_users(db, skip=skip, limit=limit)
    total = len(users)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[UserResponse.from_orm(u) for u in users],
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/{user_id}", response_model=ResponseModel)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_user = UserService.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(code=200, message="获取成功", data=UserResponse.from_orm(db_user))


@router.put("/{user_id}", response_model=ResponseModel)
def update_user(
    user_id: int, 
    user: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="无权限修改其他用户信息")
    db_user = UserService.update_user(db, user_id=user_id, user=user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(code=200, message="更新成功", data=UserResponse.from_orm(db_user))


@router.delete("/{user_id}", response_model=ResponseModel)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="无权限删除其他用户")
    success = UserService.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
