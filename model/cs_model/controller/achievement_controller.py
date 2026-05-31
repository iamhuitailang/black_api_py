from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.db import get_db
from ..business.achievement_business import AchievementBusiness
from ..utils.response import success_response, error_response
from .user_controller import get_current_user

router = APIRouter(prefix="/api/achievement", tags=["成就"])

class AchievementCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    achievement_type: Optional[str] = "kill"
    target_value: Optional[int] = 0
    icon: Optional[str] = ""

class AchievementUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    achievement_type: Optional[str] = None
    target_value: Optional[int] = None
    icon: Optional[str] = None

@router.get("/list")
def get_achievements(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    achievements = AchievementBusiness.get_achievements(db, skip, limit)
    return success_response([{
        "id": a.id,
        "name": a.name,
        "description": a.description,
        "type": a.type,
        "target_value": a.target_value,
        "icon": a.icon
    } for a in achievements])

@router.get("/user/{user_id}")
def get_user_achievements(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.id != user_id and current_user.role != "admin":
        return error_response("无权限")
    achievements = AchievementBusiness.get_user_achievements(db, user_id)
    return success_response(achievements)

@router.post("/")
def create_achievement(req: AchievementCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    achievement = AchievementBusiness.create_achievement(db, **req.dict())
    return success_response({"id": achievement.id}, "创建成功")

@router.put("/{achievement_id}")
def update_achievement(achievement_id: int, req: AchievementUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    update_data = req.dict(exclude_unset=True)
    if "achievement_type" in update_data:
        update_data["type"] = update_data.pop("achievement_type")
    achievement = AchievementBusiness.update_achievement(db, achievement_id, **update_data)
    if not achievement:
        return error_response("成就不存在")
    return success_response(None, "更新成功")

@router.delete("/{achievement_id}")
def delete_achievement(achievement_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if AchievementBusiness.delete_achievement(db, achievement_id):
        return success_response(None, "删除成功")
    return error_response("成就不存在")
