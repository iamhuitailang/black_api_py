from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets
import json


class GameSessionModel:
    TABLE_NAME = 'tb_renlei_model_game_session'
    
    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT NOT NULL UNIQUE,
                level_id INTEGER,
                character_id INTEGER,
                game_state TEXT,
                player_position TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(session_token)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_active ON {cls.TABLE_NAME}(user_id, is_active)"
        db.execute(index_sql2)

    def create(self, user_id: int, level_id: int, character_id: int) -> str:
        session_token = secrets.token_hex(32)
        now = datetime.now().isoformat()
        
        self.db.execute(
            f"UPDATE {self.TABLE_NAME} SET is_active = 0 WHERE user_id = ? AND is_active = 1",
            (user_id,)
        )
        
        data = {
            'user_id': user_id,
            'session_token': session_token,
            'level_id': level_id,
            'character_id': character_id,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        self.exec.insert(data)
        return session_token

    def get_by_token(self, session_token: str) -> Optional[Dict[str, Any]]:
        session = self.query.find_one({'session_token': session_token})
        if session:
            session['game_state'] = json.loads(session['game_state']) if session.get('game_state') else None
            session['player_position'] = json.loads(session['player_position']) if session.get('player_position') else None
        return session

    def get_active_by_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        session = self.query.find_one({'user_id': user_id, 'is_active': 1}, order_by='created_at DESC')
        if session:
            session['game_state'] = json.loads(session['game_state']) if session.get('game_state') else None
            session['player_position'] = json.loads(session['player_position']) if session.get('player_position') else None
        return session

    def update_state(self, session_token: str, game_state: dict = None, player_position: dict = None) -> Optional[Dict[str, Any]]:
        session = self.query.find_one({'session_token': session_token})
        if not session:
            return None
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if game_state is not None:
            data['game_state'] = json.dumps(game_state)
        if player_position is not None:
            data['player_position'] = json.dumps(player_position)
        self.exec.update_by_id(session['id'], data)
        return self.get_by_token(session_token)

    def end_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        session = self.query.find_one({'session_token': session_token})
        if not session:
            return None
        now = datetime.now().isoformat()
        self.exec.update_by_id(session['id'], {'is_active': 0, 'updated_at': now})
        return self.query.find_by_id(session['id'])

    def end_all_user_sessions(self, user_id: int) -> int:
        sessions = self.query.find_all({'user_id': user_id, 'is_active': 1})
        for session in sessions:
            self.end_session(session['session_token'])
        return len(sessions)

    def get_by_user(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sessions = self.query.find_all({'user_id': user_id}, order_by='created_at DESC', limit=limit)
        for session in sessions:
            session['game_state'] = json.loads(session['game_state']) if session.get('game_state') else None
            session['player_position'] = json.loads(session['player_position']) if session.get('player_position') else None
        return sessions

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
