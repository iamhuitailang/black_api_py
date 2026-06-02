from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class ZumaGameRecordModel:
    TABLE_NAME = 'tb_zuma_model_game_records'

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
                game_state TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def save_game_state(self, user_id: int, game_state: Dict[str, Any]) -> int:
        existing = self.query.find_one({'user_id': user_id})
        now = datetime.now().isoformat()
        state_json = json.dumps(game_state, ensure_ascii=False)

        if existing:
            return self.exec.update_by_id(existing.get('id'), {
                'game_state': state_json,
                'updated_at': now
            })
        else:
            return self.exec.insert({
                'user_id': user_id,
                'game_state': state_json,
                'created_at': now,
                'updated_at': now
            })

    def get_game_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        result = self.query.find_one({'user_id': user_id})
        if result and result.get('game_state'):
            try:
                return json.loads(result.get('game_state'))
            except Exception:
                return None
        return None

    def clear_game_state(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount
