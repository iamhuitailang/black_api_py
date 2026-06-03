from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict
from database import get_db
from schemas import UserProgressUpdate, ResponseModel, UserProgressResponse
from services import UserProgressService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/progress", tags=["进度"])


@router.get("/", response_model=ResponseModel)
def read_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.get_user_progress(db, user_id=current_user.id)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="获取成功", data=UserProgressResponse.from_orm(db_progress))


@router.get("/game-state", response_model=ResponseModel)
def load_game_state(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game_state = UserProgressService.load_game_state(db, user_id=current_user.id)
    return ResponseModel(code=200, message="获取成功", data=game_state)


@router.post("/game-state", response_model=ResponseModel)
def save_game_state(
    game_state: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.save_game_state(db, user_id=current_user.id, game_state=game_state)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="保存成功", data=UserProgressResponse.from_orm(db_progress))


@router.put("/", response_model=ResponseModel)
def update_user_progress(
    progress: UserProgressUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.update_user_progress(
        db, 
        user_id=current_user.id, 
        progress=progress
    )
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="更新成功", data=UserProgressResponse.from_orm(db_progress))


@router.put("/depth", response_model=ResponseModel)
def update_depth(
    depth: float = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.update_depth(db, user_id=current_user.id, depth=depth)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="更新成功", data=UserProgressResponse.from_orm(db_progress))


@router.post("/unlock/submarine/{submarine_id}", response_model=ResponseModel)
def unlock_submarine(
    submarine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.unlock_submarine(db, user_id=current_user.id, submarine_id=submarine_id)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="解锁成功", data=UserProgressResponse.from_orm(db_progress))


@router.post("/unlock/equipment/{equipment_id}", response_model=ResponseModel)
def unlock_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.unlock_equipment(db, user_id=current_user.id, equipment_id=equipment_id)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="解锁成功", data=UserProgressResponse.from_orm(db_progress))


@router.post("/unlock/music/{music_id}", response_model=ResponseModel)
def unlock_music(
    music_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.unlock_music(db, user_id=current_user.id, music_id=music_id)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="解锁成功", data=UserProgressResponse.from_orm(db_progress))


@router.post("/discover/ruin/{ruin_id}", response_model=ResponseModel)
def discover_ruin(
    ruin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_progress = UserProgressService.discover_ruin(db, user_id=current_user.id, ruin_id=ruin_id)
    if db_progress is None:
        raise HTTPException(status_code=404, detail="进度不存在")
    return ResponseModel(code=200, message="发现成功", data=UserProgressResponse.from_orm(db_progress))
