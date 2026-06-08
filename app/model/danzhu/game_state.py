from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'tb_danzhu_model_game_state'

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
                state_json TEXT DEFAULT '{{}}',
                score INTEGER DEFAULT 0,
                combo INTEGER DEFAULT 0,
                balls_left INTEGER DEFAULT 5,
                highest_combo INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, state_json: str = '{}',
               score: int = 0, combo: int = 0,
               balls_left: int = 5, highest_combo: int = 0) -> int:
        self.exec.execute_raw(f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?", (user_id,))

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'state_json': state_json,
            'score': score,
            'combo': combo,
            'balls_left': balls_left,
            'highest_combo': highest_combo,
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'user_id': user_id},
            order_by='id DESC'
        )

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key in ['state_json', 'score', 'combo', 'balls_left', 'highest_combo']:
            if kwargs.get(key) is not None:
                data[key] = kwargs[key]
        return self.exec.update_by_id(record_id, data)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )
