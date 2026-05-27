from sqlalchemy.orm import Session
from datetime import datetime
from ..models import GameSession
from ..utils import generate_session_token, to_json_field, parse_json_field


class GameSessionBusiness:
    @staticmethod
    def create_session(db: Session, user_id: int, level_id: int, character_id: int):
        session_token = generate_session_token()
        session = GameSession(
            user_id=user_id,
            session_token=session_token,
            level_id=level_id,
            character_id=character_id,
            is_active=True
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_session_by_token(db: Session, session_token: str):
        session = db.query(GameSession).filter(
            GameSession.session_token == session_token
        ).first()
        if session:
            session.game_state = parse_json_field(session.game_state)
            session.player_position = parse_json_field(session.player_position)
        return session

    @staticmethod
    def get_active_session(db: Session, user_id: int):
        session = db.query(GameSession).filter(
            GameSession.user_id == user_id,
            GameSession.is_active == True
        ).first()
        if session:
            session.game_state = parse_json_field(session.game_state)
            session.player_position = parse_json_field(session.player_position)
        return session

    @staticmethod
    def update_session_state(db: Session, session_token: str, game_state: dict = None, player_position: dict = None):
        session = db.query(GameSession).filter(
            GameSession.session_token == session_token
        ).first()
        if not session:
            return None
        if game_state is not None:
            session.game_state = to_json_field(game_state)
        if player_position is not None:
            session.player_position = to_json_field(player_position)
        session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def end_session(db: Session, session_token: str):
        session = db.query(GameSession).filter(
            GameSession.session_token == session_token
        ).first()
        if not session:
            return None
        session.is_active = False
        session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def end_all_user_sessions(db: Session, user_id: int):
        sessions = db.query(GameSession).filter(
            GameSession.user_id == user_id,
            GameSession.is_active == True
        ).all()
        for session in sessions:
            session.is_active = False
        db.commit()
        return len(sessions)

    @staticmethod
    def get_user_sessions(db: Session, user_id: int, limit: int = 10):
        sessions = db.query(GameSession).filter(
            GameSession.user_id == user_id
        ).order_by(GameSession.created_at.desc()).limit(limit).all()
        for session in sessions:
            session.game_state = parse_json_field(session.game_state)
            session.player_position = parse_json_field(session.player_position)
        return sessions

    @staticmethod
    def delete_session(db: Session, session_id: int):
        session = db.query(GameSession).filter(GameSession.id == session_id).first()
        if not session:
            return False
        db.delete(session)
        db.commit()
        return True
