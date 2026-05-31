from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import AchievementCreate, AchievementResponse, UserAchievementResponse
from utils.response import ResponseModel, success_response, error_response
from business.achievement_business import (
    get_achievement,
    get_all_achievements,
    create_achievement,
    delete_achievement,
    get_user_achievements,
    unlock_achievement,
    check_and_unlock_achievements,
    init_default_achievements
)
from business.user_business import get_current_user
from models import User

router = APIRouter(prefix="/api/achievement", tags=["成就系统"])


@router.post("/init-default", response_model=ResponseModel[List[AchievementResponse]])
def init_default_achievements_endpoint(db: Session = Depends(get_db)):
    try:
        achievements = init_default_achievements(db)
        return success_response(achievements, "默认成就初始化成功")
    except Exception as e:
        return error_response(code=500, message=f"初始化失败: {str(e)}")


@router.post("/", response_model=ResponseModel[AchievementResponse])
def add_achievement(achievement: AchievementCreate, db: Session = Depends(get_db)):
    try:
        db_achievement = create_achievement(db, achievement=achievement)
        return success_response(db_achievement, "添加成功")
    except Exception as e:
        return error_response(code=500, message=f"添加失败: {str(e)}")


@router.get("/{achievement_id}", response_model=ResponseModel[AchievementResponse])
def read_achievement(achievement_id: int, db: Session = Depends(get_db)):
    db_achievement = get_achievement(db, achievement_id=achievement_id)
    if not db_achievement:
        return error_response(code=404, message="成就不存在")
    return success_response(db_achievement, "获取成功")


@router.get("/", response_model=ResponseModel[List[AchievementResponse]])
def read_all_achievements(db: Session = Depends(get_db)):
    achievements = get_all_achievements(db)
    return success_response(achievements, "获取成功")


@router.delete("/{achievement_id}", response_model=ResponseModel)
def delete_achievement_endpoint(achievement_id: int, db: Session = Depends(get_db)):
    success = delete_achievement(db, achievement_id=achievement_id)
    if not success:
        return error_response(code=404, message="成就不存在")
    return success_response(message="删除成功")


@router.get("/user/my", response_model=ResponseModel[List[UserAchievementResponse]])
def read_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_achievements = get_user_achievements(db, user_id=current_user.id)
    return success_response(user_achievements, "获取成功")


@router.get("/user/{user_id}", response_model=ResponseModel[List[UserAchievementResponse]])
def read_user_achievements(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_achievements = get_user_achievements(db, user_id=user_id)
    return success_response(user_achievements, "获取成功")


@router.post("/unlock/{achievement_id}", response_model=ResponseModel[UserAchievementResponse])
def unlock_achievement_endpoint(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_achievement = unlock_achievement(db, user_id=current_user.id, achievement_id=achievement_id)
    if not user_achievement:
        return error_response(code=400, message="成就已解锁或不存在")
    return success_response(user_achievement, "解锁成功")


@router.post("/check-and-unlock", response_model=ResponseModel[List[UserAchievementResponse]])
def check_and_unlock_achievements_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unlocked = check_and_unlock_achievements(db, user_id=current_user.id)
    return success_response(unlocked, f"解锁了 {len(unlocked)} 个成就")
