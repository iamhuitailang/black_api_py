from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database.db import get_db
from ..models.user import User
from ..models.game_record import GameRecord
from ..utils.response import success_response

router = APIRouter(prefix="/api/admin", tags=["管理员统计"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar()
    total_games = db.query(func.count(GameRecord.id)).scalar()
    total_kills = db.query(func.sum(GameRecord.kills)).scalar() or 0
    total_deaths = db.query(func.sum(GameRecord.deaths)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    return success_response({
        "total_users": total_users,
        "total_games": total_games,
        "total_kills": total_kills,
        "total_deaths": total_deaths,
        "active_users": active_users,
        "avg_kills_per_game": total_kills / total_games if total_games > 0 else 0
    })
