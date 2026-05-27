from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.config import get_db
from business.game_record_business import GameRecordBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/game-record", tags=["game-record"])


class GameRecordCreate(BaseModel):
    player1_id: int
    player2_id: int
    winner_id: Optional[int] = None
    player1_health: Optional[float] = 0
    player2_health: Optional[float] = 0
    player1_score: Optional[int] = 0
    player2_score: Optional[int] = 0
    scene: Optional[str] = "space"
    game_mode: Optional[str] = "single"
    duration: Optional[float] = 0
    detail: Optional[Dict[str, Any]] = None


class GameRecordResponse(BaseModel):
    id: int
    player1_id: int
    player2_id: int
    winner_id: Optional[int]
    player1_health: float
    player2_health: float
    player1_score: int
    player2_score: int
    scene: str
    game_mode: str
    duration: float
    detail: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[GameRecordResponse])
def create_game_record(record: GameRecordCreate, db: Session = Depends(get_db)):
    try:
        business = GameRecordBusiness(db)
        result = business.create(**record.model_dump())
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{record_id}", response_model=ResponseModel[GameRecordResponse])
def get_game_record(record_id: int, db: Session = Depends(get_db)):
    try:
        business = GameRecordBusiness(db)
        result = business.get_by_id(record_id)
        if not result:
            raise HTTPException(status_code=404, detail="Game record not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[GameRecordResponse]])
def get_all_game_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = GameRecordBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/player/{player_id}", response_model=ResponseModel[List[GameRecordResponse]])
def get_player_records(player_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = GameRecordBusiness(db)
        result = business.get_by_player(player_id, skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{record_id}", response_model=ResponseModel[bool])
def delete_game_record(record_id: int, db: Session = Depends(get_db)):
    try:
        business = GameRecordBusiness(db)
        result = business.delete(record_id)
        if not result:
            raise HTTPException(status_code=404, detail="Game record not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))
