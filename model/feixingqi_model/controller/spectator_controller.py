from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.spectator_business import SpectatorBusiness
from model.feixingqi_model.utils import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/feixingqi/spectator", tags=["飞行棋-观战"])

@router.post("/{room_id}/join", response_model=ResponseModel)
def join_spectator(room_id: int, user_id: int, db: Session = Depends(get_db)):
    spectator = SpectatorBusiness.join_spectator(db, room_id, user_id)
    if not spectator:
        return error_response(400, "观战失败，房间不存在或尚未开始游戏")
    return success_response({
        "id": spectator.id,
        "room_id": spectator.room_id,
        "user_id": spectator.user_id,
        "joined_at": spectator.joined_at.isoformat() if spectator.joined_at else None
    }, "成功加入观战")

@router.post("/{room_id}/leave", response_model=ResponseModel)
def leave_spectator(room_id: int, user_id: int, db: Session = Depends(get_db)):
    success = SpectatorBusiness.leave_spectator(db, room_id, user_id)
    if not success:
        return error_response(404, "未找到观战记录")
    return success_response(None, "成功离开观战")

@router.get("/room/{room_id}", response_model=ResponseModel)
def get_room_spectators(room_id: int, db: Session = Depends(get_db)):
    spectators = SpectatorBusiness.get_room_spectators(db, room_id)
    return success_response(spectators)

@router.get("/user/{user_id}", response_model=ResponseModel)
def get_user_spectating_rooms(user_id: int, db: Session = Depends(get_db)):
    rooms = SpectatorBusiness.get_user_spectating_rooms(db, user_id)
    return success_response(rooms)
