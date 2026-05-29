from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..db.database import get_db
from ..business import UserBusiness

router = APIRouter(prefix="/api/users", tags=["用户管理"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = UserBusiness.decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = UserBusiness.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserBusiness.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    if user.email:
        db_email = UserBusiness.get_user_by_email(db, email=user.email)
        if db_email:
            raise HTTPException(status_code=400, detail="邮箱已存在")
    db_user = UserBusiness.create_user(db, username=user.username, password=user.password, email=user.email)
    access_token = UserBusiness.create_access_token(data={"user_id": db_user.id, "username": db_user.username, "role": db_user.role})
    return {
        "code": 200,
        "message": "注册成功",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "role": db_user.role,
                "avatar": db_user.avatar
            }
        }
    }


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = UserBusiness.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = UserBusiness.create_access_token(data={"user_id": user.id, "username": user.username, "role": user.role})
    return {
        "code": 200,
        "message": "登录成功",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "avatar": user.avatar
            }
        }
    }


@router.get("/me")
def read_current_user(current_user=Depends(get_current_user)):
    return {
        "code": 200,
        "message": "成功",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "avatar": current_user.avatar,
            "created_at": current_user.created_at
        }
    }


@router.put("/me")
def update_current_user(user_update: UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    updated_user = UserBusiness.update_user(db, user_id=current_user.id, **user_update.dict(exclude_unset=True))
    return {
        "code": 200,
        "message": "更新成功",
        "data": {
            "id": updated_user.id,
            "username": updated_user.username,
            "email": updated_user.email,
            "role": updated_user.role,
            "avatar": updated_user.avatar
        }
    }


@router.post("/change-password")
def change_password(password_change: PasswordChange, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    success = UserBusiness.change_password(db, user_id=current_user.id, old_password=password_change.old_password, new_password=password_change.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="原密码错误")
    return {"code": 200, "message": "密码修改成功", "data": None}


@router.get("/")
def list_users(skip: int = 0, limit: int = 100, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    users = UserBusiness.list_users(db, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "成功",
        "data": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "avatar": u.avatar,
                "created_at": u.created_at
            }
            for u in users
        ]
    }


@router.delete("/{user_id}")
def delete_user(user_id: int, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    success = UserBusiness.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"code": 200, "message": "删除成功", "data": None}
