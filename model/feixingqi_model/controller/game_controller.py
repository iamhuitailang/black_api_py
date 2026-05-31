from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.game_business import GameBusiness
from model.feixingqi_model.business.item_business import ItemBusiness
from model.feixingqi_model.utils import success_response, error_response, ResponseModel
from typing import Optional
import json

router = APIRouter(prefix="/api/feixingqi/game", tags=["飞行棋-游戏"])

class UseItemRequest(BaseModel):
    user_id: int
    item_id: int
    target_user_id: Optional[int] = None

@router.post("/{room_id}/init", response_model=ResponseModel)
def init_game(room_id: int, db: Session = Depends(get_db)):
    game_state = GameBusiness.init_game(db, room_id)
    if not game_state:
        return error_response(400, "游戏初始化失败")
    return success_response({
        "room_id": room_id,
        "game_phase": game_state.game_phase,
        "current_player_index": game_state.current_player_index,
        "players_state": json.loads(game_state.players_state),
        "dice_value": game_state.dice_value,
        "turn_count": game_state.turn_count
    }, "游戏初始化成功")

@router.get("/{room_id}/state", response_model=ResponseModel)
def get_game_state(room_id: int, db: Session = Depends(get_db)):
    game_state = GameBusiness.get_game_state(db, room_id)
    if not game_state:
        return error_response(404, "游戏状态不存在")
    return success_response({
        "room_id": room_id,
        "game_phase": game_state.game_phase,
        "current_player_index": game_state.current_player_index,
        "players_state": json.loads(game_state.players_state),
        "dice_value": game_state.dice_value,
        "turn_count": game_state.turn_count,
        "is_game_over": game_state.is_game_over,
        "winner_id": game_state.winner_id,
        "last_action": json.loads(game_state.last_action) if game_state.last_action else None,
        "updated_at": game_state.updated_at.isoformat() if game_state.updated_at else None
    })

@router.post("/{room_id}/roll", response_model=ResponseModel)
def roll_dice(room_id: int, user_id: int, db: Session = Depends(get_db)):
    game_state, dice_value, error = GameBusiness.roll_dice(db, room_id, user_id)
    if error:
        return error_response(400, error)
    return success_response({
        "dice_value": dice_value,
        "game_phase": game_state.game_phase,
        "current_player_index": game_state.current_player_index,
        "players_state": json.loads(game_state.players_state)
    }, f"掷出了 {dice_value} 点")

@router.post("/{room_id}/move", response_model=ResponseModel)
def move_piece(room_id: int, user_id: int, piece_id: int, db: Session = Depends(get_db)):
    game_state, message = GameBusiness.move_piece(db, room_id, user_id, piece_id)
    if not game_state:
        return error_response(400, message)
    return success_response({
        "message": message,
        "game_phase": game_state.game_phase,
        "current_player_index": game_state.current_player_index,
        "players_state": json.loads(game_state.players_state),
        "is_game_over": game_state.is_game_over,
        "winner_id": game_state.winner_id,
        "turn_count": game_state.turn_count
    }, message)

@router.post("/{room_id}/use-item", response_model=ResponseModel)
def use_item(room_id: int, req: UseItemRequest, db: Session = Depends(get_db)):
    game_state = GameBusiness.get_game_state(db, room_id)
    if not game_state or game_state.is_game_over:
        return error_response(400, "游戏已结束")
    
    item = ItemBusiness.get_item_by_id(db, req.item_id)
    if not item:
        return error_response(404, "道具不存在")
    
    effect = json.loads(item.effect)
    players_state = json.loads(game_state.players_state)
    
    if effect["type"] == "shield":
        for p in players_state:
            if p["user_id"] == req.user_id:
                p["has_shield"] = True
                break
    elif effect["type"] in ["double_dice", "lucky_six"]:
        for p in players_state:
            if p["user_id"] == req.user_id:
                p["active_buffs"].append(effect["type"])
                break
    elif effect["type"] == "missile":
        if not req.target_user_id:
            return error_response(400, "需要指定目标用户")
        for p in players_state:
            if p["user_id"] == req.target_user_id:
                if p.get("has_shield"):
                    p["has_shield"] = False
                else:
                    for piece in p["pieces"]:
                        if not piece["is_home"] and not piece["is_finished"]:
                            piece["position"] = -1
                            piece["is_home"] = True
                            break
                break
    elif effect["type"] == "teleport":
        for p in players_state:
            if p["user_id"] == req.user_id:
                for piece in p["pieces"]:
                    if not piece["is_home"] and not piece["is_finished"] and piece["position"] > 0:
                        piece["position"] = min(56, piece["position"] + 10)
                        break
                break
    
    success = ItemBusiness.use_user_item(db, req.user_id, req.item_id)
    if not success:
        return error_response(400, "道具不足")
    
    game_state.players_state = json.dumps(players_state)
    db.commit()
    db.refresh(game_state)
    
    return success_response({
        "item_name": item.item_name,
        "players_state": players_state,
        "effect": effect
    }, f"使用了 {item.item_name}")

@router.get("/records", response_model=ResponseModel)
def get_game_records(page: int = 1, page_size: int = 10, user_id: int = None, db: Session = Depends(get_db)):
    records, total = GameBusiness.get_game_records(db, page, page_size, user_id)
    record_list = []
    for r in records:
        record_list.append({
            "id": r.id,
            "room_id": r.room_id,
            "room_code": r.room_code,
            "player_ids": json.loads(r.player_ids),
            "winner_id": r.winner_id,
            "duration": r.duration,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return success_response({
        "list": record_list,
        "total": total,
        "page": page,
        "page_size": page_size
    })
