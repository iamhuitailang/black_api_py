from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserCreate, UserLogin, ResponseModel, UserResponse
from services import UserService
import jwt
from services.user_service import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/user", tags=["用户"])


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="认证令牌无效")
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="认证令牌已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="认证令牌无效")


@router.post("/register", response_model=ResponseModel)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user, error = UserService.register(db, user_data)
    if error:
        return ResponseModel(code=400, message=error)
    return ResponseModel(data=UserResponse.model_validate(user))


@router.post("/login", response_model=ResponseModel)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    result, error = UserService.login(db, login_data)
    if error:
        return ResponseModel(code=400, message=error)
    return ResponseModel(data={
        "user": UserResponse.model_validate(result["user"]),
        "token": result["token"]
    })


@router.get("/info", response_model=ResponseModel)
def get_user_info(current_user=Depends(get_current_user)):
    return ResponseModel(data=UserResponse.model_validate(current_user))


@router.get("/list", response_model=ResponseModel)
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = UserService.list_users(db, skip, limit)
    return ResponseModel(data=[UserResponse.model_validate(u) for u in users])


@router.delete("/{user_id}", response_model=ResponseModel)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = UserService.delete_user(db, user_id)
    if not success:
        return ResponseModel(code=404, message="用户不存在")
    return ResponseModel(message="删除成功")
