from datetime import datetime
from typing import Dict, Any, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'tb_dafeiji_model_game_state'

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
                plane_id TEXT NOT NULL,
                state_data TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                wave INTEGER DEFAULT 1,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def get_active_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_one({'user_id': user_id, 'is_active': 1}, order_by='id DESC')
        if row and row.get('state_data'):
            try:
                row['state_data'] = json.loads(row['state_data'])
            except Exception:
                row['state_data'] = {}
        return row

    def create_state(self, user_id: int, plane_id: str, state_data: Dict[str, Any],
                     score: int = 0, wave: int = 1) -> int:
        now = datetime.now().isoformat()
        self.deactivate_all_states(user_id)
        data = {
            'user_id': user_id,
            'plane_id': plane_id,
            'state_data': json.dumps(state_data),
            'score': score,
            'wave': wave,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def update_state(self, state_id: int, state_data: Dict[str, Any],
                     score: int = None, wave: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'state_data': json.dumps(state_data),
            'updated_at': now
        }
        if score is not None:
            data['score'] = score
        if wave is not None:
            data['wave'] = wave
        return self.exec.update_by_id(state_id, data)

    def deactivate_all_states(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        sql = f"UPDATE {self.TABLE_NAME} SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1"
        cursor = self.db.execute(sql, (now, user_id))
        return cursor.rowcount if cursor else 0

    def deactivate_state(self, state_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(state_id, {'is_active': 0, 'updated_at': now})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and row.get('state_data'):
            try:
                row['state_data'] = json.loads(row['state_data'])
            except Exception:
                pass
        return row

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
