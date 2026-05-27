from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database.config import get_db
from business.player_business import PlayerBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/player", tags=["player"])


class PlayerCreate(BaseModel):
    name: str


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    health: Optional[float] = None
    max_health: Optional[float] = None
    x: Optional[float] = None
    y: Optional[float] = None
    velocity_x: Optional[float] = None
    velocity_y: Optional[float] = None
    score: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None


class PlayerResponse(BaseModel):
    id: int
    name: str
    health: float
    max_health: float
    x: float
    y: float
    velocity_x: float
    velocity_y: float
    score: int
    wins: int
    losses: int

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[PlayerResponse])
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.create(name=player.name)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{player_id}", response_model=ResponseModel[PlayerResponse])
def get_player(player_id: int, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.get_by_id(player_id)
        if not result:
            raise HTTPException(status_code=404, detail="Player not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[PlayerResponse]])
def get_all_players(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.put("/{player_id}", response_model=ResponseModel[PlayerResponse])
def update_player(player_id: int, player: PlayerUpdate, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.update(player_id, **player.model_dump(exclude_none=True))
        if not result:
            raise HTTPException(status_code=404, detail="Player not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{player_id}", response_model=ResponseModel[bool])
def delete_player(player_id: int, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.delete(player_id)
        if not result:
            raise HTTPException(status_code=404, detail="Player not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.post("/{player_id}/win", response_model=ResponseModel[PlayerResponse])
def add_win(player_id: int, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.add_win(player_id)
        if not result:
            raise HTTPException(status_code=404, detail="Player not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.post("/{player_id}/loss", response_model=ResponseModel[PlayerResponse])
def add_loss(player_id: int, db: Session = Depends(get_db)):
    try:
        business = PlayerBusiness(db)
        result = business.add_loss(player_id)
        if not result:
            raise HTTPException(status_code=404, detail="Player not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))
