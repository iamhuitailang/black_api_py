from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..business.user_progress_business import UserProgressBusiness
from ..business.user_business import UserBusiness
from ..utils import json_response, decode_access_token

router = APIRouter(prefix="/api/progress", tags=["progress"])


class CompleteLevelRequest(BaseModel):
    level_id: int
    completion_time: Optional[float] = None


class IncrementAttemptsRequest(BaseModel):
    level_id: int


def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    user = UserBusiness.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.get("/my")
def get_my_progress(token: str, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        progresses = UserProgressBusiness.get_user_progresses(db, user.id)
        return json_response(data=[{
            "id": p.id,
            "level_id": p.level_id,
            "is_completed": p.is_completed,
            "best_time": p.best_time,
            "attempts": p.attempts,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None
        } for p in progresses])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/level/{level_id}")
def get_level_progress(token: str, level_id: int, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        progress = UserProgressBusiness.get_or_create_progress(db, user.id, level_id)
        return json_response(data={
            "id": progress.id,
            "level_id": progress.level_id,
            "is_completed": progress.is_completed,
            "best_time": progress.best_time,
            "attempts": progress.attempts,
            "completed_at": progress.completed_at.isoformat() if progress.completed_at else None
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/attempt")
def increment_attempts(token: str, request: IncrementAttemptsRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        progress = UserProgressBusiness.increment_attempts(db, user.id, request.level_id)
        return json_response(data={"attempts": progress.attempts})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/complete")
def complete_level(token: str, request: CompleteLevelRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        progress = UserProgressBusiness.complete_level(db, user.id, request.level_id, request.completion_time)
        return json_response(data={
            "is_completed": progress.is_completed,
            "best_time": progress.best_time,
            "attempts": progress.attempts
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/completed")
def get_completed_levels(token: str, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        completed = UserProgressBusiness.get_completed_levels(db, user.id)
        return json_response(data=[{
            "level_id": p.level_id,
            "best_time": p.best_time,
            "attempts": p.attempts,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None
        } for p in completed])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)
