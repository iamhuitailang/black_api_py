from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from utils.database import get_db
from utils.response import success_response, error_response
from utils.auth import get_current_user
from business.user_business import (
    UserBusiness,
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdatePasswordRequest
)
from models.user import TbGuzhangModelUser

router = APIRouter(prefix="/api/auth", tags=["用户认证"])


@router.post("/register")
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    try:
        result = UserBusiness.register(db, request)
        return success_response(data=result, message="注册成功")
    except Exception as e:
        return error_response(message=str(e))


@router.post("/login")
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    try:
        result = UserBusiness.login(db, request)
        return success_response(data=result, message="登录成功")
    except Exception as e:
        return error_response(message=str(e))


@router.post("/update-password")
def update_password(request: UserUpdatePasswordRequest, db: Session = Depends(get_db),
                    current_user: TbGuzhangModelUser = Depends(get_current_user)):
    try:
        UserBusiness.update_password(db, current_user, request)
        return success_response(message="密码修改成功")
    except Exception as e:
        return error_response(message=str(e))


@router.get("/user-info")
def get_user_info(current_user: TbGuzhangModelUser = Depends(get_current_user)):
    result = UserBusiness.get_user_info(current_user)
    return success_response(data=result, message="获取成功")


@router.post("/save-record")
def save_game_record(
    player_score: float,
    opponent_score: float,
    is_win: bool,
    duration: int,
    max_cheer: float,
    combo_count: int,
    db: Session = Depends(get_db),
    current_user: TbGuzhangModelUser = Depends(get_current_user)
):
    try:
        record = UserBusiness.save_game_record(
            db, current_user.id, player_score, opponent_score,
            is_win, duration, max_cheer, combo_count
        )
        return success_response(data=record, message="保存成功")
    except Exception as e:
        return error_response(message=str(e))


@router.get("/game-records")
def get_game_records(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: TbGuzhangModelUser = Depends(get_current_user)
):
    records = UserBusiness.get_game_records(db, current_user.id, limit)
    return success_response(data=records, message="获取成功")
