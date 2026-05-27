from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.config import get_db
from business.game_save_business import GameSaveBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/game-save", tags=["game-save"])


class GameSaveCreate(BaseModel):
    player_id: int
    game_mode: Optional[str] = "single"
    scene: Optional[str] = "space"
    player_health: Optional[float] = 100.0
    enemy_health: Optional[float] = 100.0
    player_x: Optional[float] = 100.0
    player_y: Optional[float] = 300.0
    enemy_x: Optional[float] = 700.0
    enemy_y: Optional[float] = 300.0
    score: Optional[int] = 0
    game_state: Optional[str] = "playing"
    game_data: Optional[Dict[str, Any]] = None


class GameSaveUpdate(BaseModel):
    game_mode: Optional[str] = None
    scene: Optional[str] = None
    player_health: Optional[float] = None
    enemy_health: Optional[float] = None
    player_x: Optional[float] = None
    player_y: Optional[float] = None
    enemy_x: Optional[float] = None
    enemy_y: Optional[float] = None
    score: Optional[int] = None
    game_state: Optional[str] = None
    is_active: Optional[bool] = None
    game_data: Optional[Dict[str, Any]] = None


class GameSaveResponse(BaseModel):
    id: int
    player_id: int
    game_mode: str
    scene: str
    player_health: float
    enemy_health: float
    player_x: float
    player_y: float
    enemy_x: float
    enemy_y: float
    score: int
    game_state: str
    is_active: bool
    game_data: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[GameSaveResponse])
def create_game_save(save: GameSaveCreate, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        business.deactivate_all(save.player_id)
        result = business.create(**save.model_dump())
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{save_id}", response_model=ResponseModel[GameSaveResponse])
def get_game_save(save_id: int, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        result = business.get_by_id(save_id)
        if not result:
            raise HTTPException(status_code=404, detail="Game save not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/player/{player_id}/active", response_model=ResponseModel[Optional[GameSaveResponse]])
def get_active_save(player_id: int, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        result = business.get_active_by_player(player_id)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/player/{player_id}", response_model=ResponseModel[List[GameSaveResponse]])
def get_player_saves(player_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        result = business.get_by_player(player_id, skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[GameSaveResponse]])
def get_all_game_saves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.put("/{save_id}", response_model=ResponseModel[GameSaveResponse])
def update_game_save(save_id: int, save: GameSaveUpdate, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        update_data = save.model_dump(exclude_none=True)
        if "game_data" in update_data and update_data["game_data"] is not None:
            import json
            update_data["game_data"] = json.dumps(update_data["game_data"])
        result = business.update(save_id, **update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Game save not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{save_id}", response_model=ResponseModel[bool])
def delete_game_save(save_id: int, db: Session = Depends(get_db)):
    try:
        business = GameSaveBusiness(db)
        result = business.delete(save_id)
        if not result:
            raise HTTPException(status_code=404, detail="Game save not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))
