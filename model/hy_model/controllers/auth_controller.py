from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserCreate, UserLogin, ResponseModel, UserResponse
from services import UserService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=ResponseModel)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserService.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    db_user = UserService.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    
    user = UserService.create_user(db=db, user=user)
    return ResponseModel(code=200, message="注册成功", data=UserResponse.from_orm(user))


@router.post("/login", response_model=ResponseModel)
def login(user: UserLogin, db: Session = Depends(get_db)):
    result = UserService.login_user(db, username=user.username, password=user.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    return ResponseModel(code=200, message="登录成功", data={
        "user": UserResponse.from_orm(result["user"]),
        "token": result["token"]
    })


@router.get("/me", response_model=ResponseModel)
def read_users_me(current_user: User = Depends(get_current_user)):
    return ResponseModel(code=200, message="获取成功", data=UserResponse.from_orm(current_user))
