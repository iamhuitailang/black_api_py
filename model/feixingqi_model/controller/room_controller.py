from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.room_business import RoomBusiness
from model.feixingqi_model.business.user_business import UserBusiness
from model.feixingqi_model.utils import success_response, error_response, ResponseModel
from typing import Optional
import json

router = APIRouter(prefix="/api/feixingqi/room", tags=["飞行棋-房间"])

class CreateRoomRequest(BaseModel):
    creator_id: int
    room_name: str
    max_players: int = 4
    password: Optional[str] = None
    game_mode: str = "classic"

class JoinRoomRequest(BaseModel):
    user_id: int
    password: Optional[str] = None

class QuickMatchRequest(BaseModel):
    user_id: int
    game_mode: Optional[str] = None

@router.post("", response_model=ResponseModel)
def create_room(req: CreateRoomRequest, db: Session = Depends(get_db)):
    user = UserBusiness.get_user_by_id(db, req.creator_id)
    if not user:
        return error_response(404, "用户不存在")
    room = RoomBusiness.create_room(db, req.creator_id, req.room_name, req.max_players, req.password, req.game_mode)
    return success_response({
        "id": room.id,
        "room_name": room.room_name,
        "room_code": room.room_code,
        "creator_id": room.creator_id,
        "max_players": room.max_players,
        "current_players": room.current_players,
        "player_ids": json.loads(room.player_ids),
        "status": room.status,
        "game_mode": room.game_mode,
        "has_password": bool(room.password)
    }, "房间创建成功")

@router.get("/{room_id}", response_model=ResponseModel)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = RoomBusiness.get_room_by_id(db, room_id)
    if not room:
        return error_response(404, "房间不存在")
    players = []
    for pid in json.loads(room.player_ids):
        user = UserBusiness.get_user_by_id(db, pid)
        if user:
            players.append({
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar": user.avatar,
                "is_creator": user.id == room.creator_id
            })
    return success_response({
        "id": room.id,
        "room_name": room.room_name,
        "room_code": room.room_code,
        "creator_id": room.creator_id,
        "max_players": room.max_players,
        "current_players": room.current_players,
        "players": players,
        "status": room.status,
        "game_mode": room.game_mode,
        "has_password": bool(room.password),
        "created_at": room.created_at.isoformat() if room.created_at else None
    })

@router.get("/code/{room_code}", response_model=ResponseModel)
def get_room_by_code(room_code: str, db: Session = Depends(get_db)):
    room = RoomBusiness.get_room_by_code(db, room_code)
    if not room:
        return error_response(404, "房间不存在")
    return success_response({
        "id": room.id,
        "room_name": room.room_name,
        "room_code": room.room_code,
        "creator_id": room.creator_id,
        "max_players": room.max_players,
        "current_players": room.current_players,
        "status": room.status,
        "has_password": bool(room.password)
    })

@router.get("", response_model=ResponseModel)
def list_rooms(page: int = 1, page_size: int = 10, status: str = None, keyword: str = None, db: Session = Depends(get_db)):
    rooms, total = RoomBusiness.get_room_list(db, page, page_size, status, keyword)
    room_list = []
    for room in rooms:
        creator = UserBusiness.get_user_by_id(db, room.creator_id)
        room_list.append({
            "id": room.id,
            "room_name": room.room_name,
            "room_code": room.room_code,
            "creator_id": room.creator_id,
            "creator_name": creator.nickname if creator else "",
            "max_players": room.max_players,
            "current_players": room.current_players,
            "status": room.status,
            "game_mode": room.game_mode,
            "has_password": bool(room.password),
            "created_at": room.created_at.isoformat() if room.created_at else None
        })
    return success_response({
        "list": room_list,
        "total": total,
        "page": page,
        "page_size": page_size
    })

@router.post("/{room_id}/join", response_model=ResponseModel)
def join_room(room_id: int, req: JoinRoomRequest, db: Session = Depends(get_db)):
    room = RoomBusiness.join_room(db, room_id, req.user_id, req.password)
    if not room:
        return error_response(400, "加入房间失败，可能房间已满或密码错误")
    return success_response({
        "id": room.id,
        "room_name": room.room_name,
        "room_code": room.room_code,
        "current_players": room.current_players,
        "player_ids": json.loads(room.player_ids)
    }, "加入成功")

@router.post("/{room_id}/leave", response_model=ResponseModel)
def leave_room(room_id: int, user_id: int, db: Session = Depends(get_db)):
    room = RoomBusiness.leave_room(db, room_id, user_id)
    return success_response({"room_removed": room is None}, "离开成功")

@router.post("/{room_id}/start", response_model=ResponseModel)
def start_game(room_id: int, user_id: int, db: Session = Depends(get_db)):
    room = RoomBusiness.get_room_by_id(db, room_id)
    if not room:
        return error_response(404, "房间不存在")
    if room.creator_id != user_id:
        return error_response(403, "只有房主可以开始游戏")
    if room.current_players < 2:
        return error_response(400, "至少需要2名玩家才能开始游戏")
    return success_response({"room_id": room_id}, "游戏准备开始")

@router.delete("/{room_id}", response_model=ResponseModel)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    success = RoomBusiness.delete_room(db, room_id)
    if not success:
        return error_response(404, "房间不存在")
    return success_response(None, "删除成功")

@router.post("/quick-match", response_model=ResponseModel)
def quick_match(req: QuickMatchRequest, db: Session = Depends(get_db)):
    user = UserBusiness.get_user_by_id(db, req.user_id)
    if not user:
        return error_response(404, "用户不存在")
    room = RoomBusiness.quick_match(db, req.user_id, req.game_mode)
    if not room:
        room = RoomBusiness.create_room(db, req.user_id, f"{user.nickname}的房间", 4, None, req.game_mode or "classic")
        return success_response({
            "id": room.id,
            "room_name": room.room_name,
            "room_code": room.room_code,
            "creator_id": room.creator_id,
            "max_players": room.max_players,
            "current_players": room.current_players,
            "player_ids": json.loads(room.player_ids),
            "status": room.status,
            "game_mode": room.game_mode,
            "has_password": False,
            "is_new_room": True
        }, "未找到可加入的房间，已为您创建新房间")
    return success_response({
        "id": room.id,
        "room_name": room.room_name,
        "room_code": room.room_code,
        "creator_id": room.creator_id,
        "max_players": room.max_players,
        "current_players": room.current_players,
        "player_ids": json.loads(room.player_ids),
        "status": room.status,
        "game_mode": room.game_mode,
        "has_password": False,
        "is_new_room": False
    }, "快速匹配成功")
