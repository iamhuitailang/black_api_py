from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from schemas.user import UserCreate, UserLogin, UserUpdate
from schemas.common import LoginResponse
from models.user import User
from business.user import UserBusiness

router = APIRouter(prefix="/api/user", tags=["用户"])


@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = UserBusiness.register(db, user_data)
        return ResponseUtil.success(data={
            "user_id": user.id,
            "username": user.username
        }, message="注册成功")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=f"注册失败: {str(e)}")


@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = UserBusiness.login(db, user_data.username, user_data.password)
        if not user:
            return ResponseUtil.error(message="用户名或密码错误", code=401)

        access_token = create_access_token(
            data={"user_id": user.id},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return ResponseUtil.success(data={
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "role": user.role,
            "avatar": user.avatar,
            "points": user.points
        }, message="登录成功")
    except Exception as e:
        return ResponseUtil.error(message=f"登录失败: {str(e)}")


@router.get("/info")
def get_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user = UserBusiness.get_user_by_id(db, current_user.id)
        if not user:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(data={
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "phone": user.phone,
            "email": user.email,
            "points": user.points,
            "total_points": user.total_points,
            "role": user.role,
            "profile_completed": user.profile_completed,
            "invite_code": user.invite_code,
            "invited_by": user.invited_by,
            "status": user.status,
            "created_at": user.created_at
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/update")
def update_user(user_data: UserUpdate, current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        user = UserBusiness.update_user(db, current_user.id, user_data)
        if not user:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=f"更新失败: {str(e)}")


@router.post("/complete-profile")
def complete_profile(current_user: User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    try:
        user = UserBusiness.update_profile_completed(db, current_user.id)
        user = UserBusiness.update_user_points(
            db, current_user.id, 30,
            description="完善个人资料",
            points_type="profile"
        )
        return ResponseUtil.success(data={
            "points": user.points,
            "reward": 30
        }, message="资料完善成功，获得30积分")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list_users(page: int = 1, page_size: int = 10, keyword: str = "",
               current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    try:
        if current_user.role != "admin":
            return ResponseUtil.error(message="无权限", code=403)
        users, total = UserBusiness.list_users(db, page, page_size, keyword)
        return ResponseUtil.page(data=[{
            "id": u.id,
            "username": u.username,
            "nickname": u.nickname,
            "avatar": u.avatar,
            "points": u.points,
            "total_points": u.total_points,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at
        } for u in users], total=total, page=page, page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/role/{user_id}")
def update_role(user_id: int, role: str,
                current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        if current_user.role != "admin":
            return ResponseUtil.error(message="无权限", code=403)
        user = UserBusiness.update_user_role(db, user_id, role)
        if not user:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(message="角色更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/status/{user_id}")
def update_status(user_id: int, status: str,
                  current_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    try:
        if current_user.role != "admin":
            return ResponseUtil.error(message="无权限", code=403)
        user = UserBusiness.update_user_status(db, user_id, status)
        if not user:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(message="状态更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        if current_user.role != "admin":
            return ResponseUtil.error(message="无权限", code=403)
        result = UserBusiness.delete_user(db, user_id)
        if not result:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/rank")
def get_points_rank(limit: int = 20, db: Session = Depends(get_db)):
    try:
        rank_list = UserBusiness.get_points_rank(db, limit)
        return ResponseUtil.success(data=rank_list)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/my-rank")
def get_my_rank(current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        rank_info = UserBusiness.get_user_rank(db, current_user.id)
        if not rank_info:
            return ResponseUtil.error(message="用户不存在", code=404)
        return ResponseUtil.success(data=rank_info)
    except Exception as e:
        return ResponseUtil.error(message=str(e))
