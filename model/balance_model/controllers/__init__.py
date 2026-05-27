from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from business import (
    UserBusiness, LevelBusiness, GameSaveBusiness, 
    ScoreRecordBusiness, BlockTemplateBusiness
)

router = APIRouter(prefix="/api/balance")


def success_response(data=None, message="success"):
    return {"code": 200, "message": message, "data": data}


def error_response(code=400, message="error"):
    return {"code": code, "message": message, "data": None}


class UserCreate(BaseModel):
    username: str
    password: str
    nickname: str = None


class UserUpdate(BaseModel):
    nickname: str = None
    avatar: str = None


class LevelCreate(BaseModel):
    name: str
    description: str = None
    difficulty: int = 1
    target_height: float = 0
    target_score: int = 0
    gravity: float = 9.8
    wind_force: float = 0
    wind_direction: float = 0


class GameSaveCreate(BaseModel):
    user_id: int
    level_id: int
    blocks_data: str
    save_name: str = None
    current_score: int = 0
    current_height: float = 0
    is_auto_save: bool = False


class ScoreCreate(BaseModel):
    user_id: int
    level_id: int
    score: int
    height: float = 0
    blocks_used: int = 0
    is_stable: bool = False
    play_time: float = 0


class BlockTemplateCreate(BaseModel):
    name: str
    type: str
    width: float
    height: float
    weight: float
    load_capacity: float
    color: str = None
    description: str = None


@router.get("/users")
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = UserBusiness.get_users(db, skip, limit)
    return success_response([{
        "id": u.id,
        "username": u.username,
        "nickname": u.nickname,
        "avatar": u.avatar,
        "total_score": u.total_score,
        "created_at": u.created_at
    } for u in users])


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserBusiness.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response({
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "total_score": user.total_score,
        "created_at": user.created_at
    })


@router.post("/users")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = UserBusiness.get_user_by_username(db, user_data.username)
    if existing:
        return error_response(400, "Username already exists")
    user = UserBusiness.create_user(db, user_data.username, user_data.password, user_data.nickname)
    return success_response({"id": user.id, "username": user.username})


@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = UserBusiness.update_user(db, user_id, **user_data.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response({"id": user.id})


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = UserBusiness.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response()


@router.post("/users/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = UserBusiness.get_user_by_username(db, username)
    if not user or user.password != password:
        return error_response(401, "Invalid username or password")
    return success_response({
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "total_score": user.total_score
    })


@router.get("/levels")
def get_levels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    levels = LevelBusiness.get_levels(db, skip, limit)
    return success_response([{
        "id": l.id,
        "name": l.name,
        "description": l.description,
        "difficulty": l.difficulty,
        "target_height": l.target_height,
        "target_score": l.target_score,
        "gravity": l.gravity,
        "wind_force": l.wind_force,
        "wind_direction": l.wind_direction,
        "created_at": l.created_at
    } for l in levels])


@router.get("/levels/{level_id}")
def get_level(level_id: int, db: Session = Depends(get_db)):
    level = LevelBusiness.get_level(db, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return success_response({
        "id": level.id,
        "name": level.name,
        "description": level.description,
        "difficulty": level.difficulty,
        "target_height": level.target_height,
        "target_score": level.target_score,
        "gravity": level.gravity,
        "wind_force": level.wind_force,
        "wind_direction": level.wind_direction
    })


@router.post("/levels")
def create_level(level_data: LevelCreate, db: Session = Depends(get_db)):
    level = LevelBusiness.create_level(db, **level_data.dict())
    return success_response({"id": level.id})


@router.put("/levels/{level_id}")
def update_level(level_id: int, level_data: LevelCreate, db: Session = Depends(get_db)):
    level = LevelBusiness.update_level(db, level_id, **level_data.dict(exclude_unset=True))
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return success_response({"id": level.id})


@router.delete("/levels/{level_id}")
def delete_level(level_id: int, db: Session = Depends(get_db)):
    success = LevelBusiness.delete_level(db, level_id)
    if not success:
        raise HTTPException(status_code=404, detail="Level not found")
    return success_response()


@router.get("/saves")
def get_saves(user_id: int = None, db: Session = Depends(get_db)):
    if user_id:
        saves = GameSaveBusiness.get_saves_by_user(db, user_id)
    else:
        saves = []
    return success_response([{
        "id": s.id,
        "user_id": s.user_id,
        "level_id": s.level_id,
        "save_name": s.save_name,
        "current_score": s.current_score,
        "current_height": s.current_height,
        "is_auto_save": s.is_auto_save,
        "created_at": s.created_at,
        "updated_at": s.updated_at
    } for s in saves])


@router.get("/saves/{save_id}")
def get_save(save_id: int, db: Session = Depends(get_db)):
    save = GameSaveBusiness.get_save(db, save_id)
    if not save:
        raise HTTPException(status_code=404, detail="Save not found")
    return success_response({
        "id": save.id,
        "user_id": save.user_id,
        "level_id": save.level_id,
        "save_name": save.save_name,
        "blocks_data": save.blocks_data,
        "current_score": save.current_score,
        "current_height": save.current_height,
        "is_auto_save": save.is_auto_save
    })


@router.get("/saves/auto/{user_id}/{level_id}")
def get_auto_save(user_id: int, level_id: int, db: Session = Depends(get_db)):
    save = GameSaveBusiness.get_auto_save(db, user_id, level_id)
    if not save:
        return success_response(None)
    return success_response({
        "id": save.id,
        "blocks_data": save.blocks_data,
        "current_score": save.current_score,
        "current_height": save.current_height
    })


@router.post("/saves")
def create_save(save_data: GameSaveCreate, db: Session = Depends(get_db)):
    save = GameSaveBusiness.create_save(
        db, save_data.user_id, save_data.level_id, 
        save_data.blocks_data, save_data.save_name,
        save_data.current_score, save_data.current_height,
        save_data.is_auto_save
    )
    return success_response({"id": save.id})


@router.delete("/saves/{save_id}")
def delete_save(save_id: int, db: Session = Depends(get_db)):
    success = GameSaveBusiness.delete_save(db, save_id)
    if not success:
        raise HTTPException(status_code=404, detail="Save not found")
    return success_response()


@router.get("/scores")
def get_scores(user_id: int = None, level_id: int = None, db: Session = Depends(get_db)):
    if user_id:
        scores = ScoreRecordBusiness.get_scores_by_user(db, user_id)
    elif level_id:
        scores = ScoreRecordBusiness.get_scores_by_level(db, level_id)
    else:
        scores = []
    return success_response([{
        "id": s.id,
        "user_id": s.user_id,
        "level_id": s.level_id,
        "score": s.score,
        "height": s.height,
        "blocks_used": s.blocks_used,
        "is_stable": s.is_stable,
        "play_time": s.play_time,
        "created_at": s.created_at
    } for s in scores])


@router.post("/scores")
def create_score(score_data: ScoreCreate, db: Session = Depends(get_db)):
    score = ScoreRecordBusiness.create_score(
        db, score_data.user_id, score_data.level_id, score_data.score,
        score_data.height, score_data.blocks_used,
        score_data.is_stable, score_data.play_time
    )
    return success_response({"id": score.id})


@router.delete("/scores/{score_id}")
def delete_score(score_id: int, db: Session = Depends(get_db)):
    success = ScoreRecordBusiness.delete_score(db, score_id)
    if not success:
        raise HTTPException(status_code=404, detail="Score not found")
    return success_response()


@router.get("/blocks")
def get_block_templates(db: Session = Depends(get_db)):
    templates = BlockTemplateBusiness.get_templates(db)
    return success_response([{
        "id": t.id,
        "name": t.name,
        "type": t.type,
        "width": t.width,
        "height": t.height,
        "weight": t.weight,
        "load_capacity": t.load_capacity,
        "color": t.color,
        "description": t.description
    } for t in templates])


@router.post("/blocks")
def create_block_template(template_data: BlockTemplateCreate, db: Session = Depends(get_db)):
    template = BlockTemplateBusiness.create_template(db, **template_data.dict())
    return success_response({"id": template.id})


@router.put("/blocks/{template_id}")
def update_block_template(template_id: int, template_data: BlockTemplateCreate, db: Session = Depends(get_db)):
    template = BlockTemplateBusiness.update_template(db, template_id, **template_data.dict(exclude_unset=True))
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return success_response({"id": template.id})


@router.delete("/blocks/{template_id}")
def delete_block_template(template_id: int, db: Session = Depends(get_db)):
    success = BlockTemplateBusiness.delete_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return success_response()
