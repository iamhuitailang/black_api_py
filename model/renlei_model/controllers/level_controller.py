from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict, List
from ..database import get_db
from ..business.level_business import LevelBusiness
from ..business.user_business import UserBusiness
from ..utils import json_response, decode_access_token

router = APIRouter(prefix="/api/level", tags=["level"])


class CreateLevelRequest(BaseModel):
    name: str
    description: Optional[str] = None
    level_type: Optional[str] = None
    difficulty: int = 1
    theme: Optional[str] = None
    start_position: Optional[Dict] = None
    end_position: Optional[Dict] = None
    obstacles: Optional[List] = None
    is_active: bool = True
    order: int = 0


class UpdateLevelRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level_type: Optional[str] = None
    difficulty: Optional[int] = None
    theme: Optional[str] = None
    start_position: Optional[Dict] = None
    end_position: Optional[Dict] = None
    obstacles: Optional[List] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    user = UserBusiness.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.get("/list")
def list_levels(token: str, only_active: bool = True, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        levels = LevelBusiness.list_levels(db, only_active)
        return json_response(data=[{
            "id": l.id,
            "name": l.name,
            "description": l.description,
            "level_type": l.level_type,
            "difficulty": l.difficulty,
            "theme": l.theme,
            "start_position": l.start_position,
            "end_position": l.end_position,
            "obstacles": l.obstacles,
            "is_active": l.is_active,
            "order": l.order
        } for l in levels])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/{level_id}")
def get_level(token: str, level_id: int, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        level = LevelBusiness.get_level_by_id(db, level_id)
        if not level:
            return json_response(code=404, message="关卡不存在")
        return json_response(data={
            "id": level.id,
            "name": level.name,
            "description": level.description,
            "level_type": level.level_type,
            "difficulty": level.difficulty,
            "theme": level.theme,
            "start_position": level.start_position,
            "end_position": level.end_position,
            "obstacles": level.obstacles,
            "is_active": level.is_active,
            "order": level.order
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/create")
def create_level(token: str, request: CreateLevelRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        level = LevelBusiness.create_level(
            db, request.name, request.description, request.level_type,
            request.difficulty, request.theme, request.start_position,
            request.end_position, request.obstacles, request.is_active, request.order
        )
        return json_response(data={"id": level.id, "name": level.name})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.put("/{level_id}")
def update_level(token: str, level_id: int, request: UpdateLevelRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        updated = LevelBusiness.update_level(
            db, level_id,
            name=request.name,
            description=request.description,
            level_type=request.level_type,
            difficulty=request.difficulty,
            theme=request.theme,
            start_position=request.start_position,
            end_position=request.end_position,
            obstacles=request.obstacles,
            is_active=request.is_active,
            order=request.order
        )
        if not updated:
            return json_response(code=404, message="关卡不存在")
        return json_response(data={"id": updated.id, "name": updated.name})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.delete("/{level_id}")
def delete_level(token: str, level_id: int, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        success = LevelBusiness.delete_level(db, level_id)
        if not success:
            return json_response(code=404, message="关卡不存在")
        return json_response(message="删除成功")
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)
