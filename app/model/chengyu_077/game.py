from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameModel:
    TABLE_NAME = 'tb_chengyu_077_model_game'

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
                game_type TEXT DEFAULT 'classic',
                mode TEXT DEFAULT 'single',
                status TEXT DEFAULT 'playing',
                current_idiom TEXT DEFAULT '',
                score INTEGER DEFAULT 0,
                combo INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                time_limit INTEGER DEFAULT 60,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        idx1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(idx1)
        idx2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(idx2)

    def create(self, user_id: int, game_type: str = 'classic', mode: str = 'single', time_limit: int = 60) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'game_type': game_type,
            'mode': mode,
            'status': 'playing',
            'current_idiom': '',
            'score': 0,
            'combo': 0,
            'max_combo': 0,
            'time_limit': time_limit,
            'started_at': now,
            'ended_at': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_state(self, game_id: int, current_idiom: str, score: int, combo: int, max_combo: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_idiom': current_idiom,
            'score': score,
            'combo': combo,
            'max_combo': max_combo,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def end_game(self, game_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': 'finished',
            'ended_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def get_by_user(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC', limit=limit)

    def get_active_game(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'status': 'playing'}, order_by='id DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
