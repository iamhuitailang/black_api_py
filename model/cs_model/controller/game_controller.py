from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.db import get_db
from ..business.game_record_business import GameRecordBusiness
from ..business.achievement_business import AchievementBusiness
from ..utils.response import success_response, error_response
from .user_controller import get_current_user

router = APIRouter(prefix="/api/game", tags=["游戏"])

class GameRecordRequest(BaseModel):
    user_id: int
    map_id: Optional[int] = None
    kills: int
    deaths: int
    is_win: int
    game_duration: int

@router.post("/record")
def create_game_record(req: GameRecordRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    record = GameRecordBusiness.create_record(db, **req.dict())
    unlocked = AchievementBusiness.check_achievements(db, req.user_id)
    return success_response({
        "record_id": record.id,
        "unlocked_achievements": [{
            "id": a.id,
            "name": a.name,
            "description": a.description
        } for a in unlocked]
    }, "记录保存成功")

@router.get("/records/{user_id}")
def get_user_records(user_id: int, db: Session = Depends(get_db), skip: int = 0, limit: int = 20, current_user = Depends(get_current_user)):
    if current_user.id != user_id and current_user.role != "admin":
        return error_response("无权限")
    records = GameRecordBusiness.get_user_records(db, user_id, skip, limit)
    return success_response([{
        "id": r.id,
        "map_id": r.map_id,
        "kills": r.kills,
        "deaths": r.deaths,
        "is_win": r.is_win,
        "game_duration": r.game_duration,
        "created_at": r.created_at
    } for r in records])

@router.get("/stats")
def get_game_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    total_games = GameRecordBusiness.get_total_games(db)
    total_kills = GameRecordBusiness.get_total_kills(db)
    avg_kills = GameRecordBusiness.get_avg_kills(db)
    return success_response({
        "total_games": total_games,
        "total_kills": total_kills,
        "avg_kills": round(avg_kills, 2)
    })
