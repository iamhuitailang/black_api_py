from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'tb_heping_model_game_states'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = """
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                state_data TEXT DEFAULT '{{}}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """.format(table_name=cls.TABLE_NAME)
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def save_state(self, user_id: int, state_data: str) -> int:
        existing = self.query.find_one({'user_id': user_id})
        now = datetime.now().isoformat()

        if existing:
            data = {
                'state_data': state_data,
                'updated_at': now
            }
            return self.exec.update_by_id(existing.get('id'), data)
        else:
            data = {
                'user_id': user_id,
                'state_data': state_data,
                'updated_at': now
            }
            return self.exec.insert(data)

    def load_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def delete_state(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
