from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameStateModel:
    TABLE_NAME = 'tb_majiang_model_game_state'

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
                user_id INTEGER NOT NULL UNIQUE,
                game_record_id INTEGER,
                state_data TEXT NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_last_updated ON {cls.TABLE_NAME}(last_updated)"
        db.execute(index_sql2)

    def save_state(self, user_id: int, state_data: Dict[str, Any], game_record_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'game_record_id': game_record_id,
            'state_data': json.dumps(state_data, ensure_ascii=False),
            'last_updated': now
        }

        existing = self.query.find_one({'user_id': user_id})
        if existing:
            return self.exec.update_by_id(existing.get('id'), data)
        else:
            data['created_at'] = now
            return self.exec.insert(data)

    def get_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_one({'user_id': user_id})
        if not record:
            return None

        try:
            state_data = json.loads(record.get('state_data', '{}'))
        except (json.JSONDecodeError, TypeError):
            state_data = {}

        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'game_record_id': record.get('game_record_id'),
            'state_data': state_data,
            'last_updated': record.get('last_updated'),
            'created_at': record.get('created_at')
        }

    def clear_state(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def update_state_partial(self, user_id: int, partial_data: Dict[str, Any]) -> int:
        current = self.get_state(user_id)
        if not current:
            return 0

        state_data = current.get('state_data', {})
        state_data.update(partial_data)
        return self.save_state(user_id, state_data, current.get('game_record_id'))

    def cleanup_old_states(self, hours: int = 24) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE last_updated < datetime('now', '-{hours} hours')"
        return self.exec.execute_raw(sql)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='last_updated DESC')
