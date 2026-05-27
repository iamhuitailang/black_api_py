from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict
from ..database import get_db
from ..business.game_session_business import GameSessionBusiness
from ..business.user_business import UserBusiness
from ..utils import json_response, decode_access_token

router = APIRouter(prefix="/api/session", tags=["session"])


class CreateSessionRequest(BaseModel):
    level_id: int
    character_id: int


class UpdateSessionRequest(BaseModel):
    session_token: str
    game_state: Optional[Dict] = None
    player_position: Optional[Dict] = None


class EndSessionRequest(BaseModel):
    session_token: str


def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    user = UserBusiness.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.post("/create")
def create_session(token: str, request: CreateSessionRequest, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        GameSessionBusiness.end_all_user_sessions(db, user.id)
        session = GameSessionBusiness.create_session(db, user.id, request.level_id, request.character_id)
        return json_response(data={
            "session_token": session.session_token,
            "level_id": session.level_id,
            "character_id": session.character_id
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/active")
def get_active_session(token: str, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        session = GameSessionBusiness.get_active_session(db, user.id)
        if not session:
            return json_response(code=404, message="没有活跃的游戏会话")
        return json_response(data={
            "session_token": session.session_token,
            "level_id": session.level_id,
            "character_id": session.character_id,
            "game_state": session.game_state,
            "player_position": session.player_position
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/{session_token}")
def get_session(token: str, session_token: str, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        session = GameSessionBusiness.get_session_by_token(db, session_token)
        if not session:
            return json_response(code=404, message="游戏会话不存在")
        return json_response(data={
            "session_token": session.session_token,
            "level_id": session.level_id,
            "character_id": session.character_id,
            "game_state": session.game_state,
            "player_position": session.player_position,
            "is_active": session.is_active
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/update")
def update_session(token: str, request: UpdateSessionRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        session = GameSessionBusiness.update_session_state(
            db, request.session_token, request.game_state, request.player_position
        )
        if not session:
            return json_response(code=404, message="游戏会话不存在")
        return json_response(data={
            "session_token": session.session_token,
            "game_state": session.game_state,
            "player_position": session.player_position
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/end")
def end_session(token: str, request: EndSessionRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        session = GameSessionBusiness.end_session(db, request.session_token)
        if not session:
            return json_response(code=404, message="游戏会话不存在")
        return json_response(message="游戏会话已结束")
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/list/my")
def get_my_sessions(token: str, limit: int = 10, db: Session = Depends(get_db)):
    try:
        user = get_current_user(token, db)
        sessions = GameSessionBusiness.get_user_sessions(db, user.id, limit)
        return json_response(data=[{
            "session_token": s.session_token,
            "level_id": s.level_id,
            "character_id": s.character_id,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat()
        } for s in sessions])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)
