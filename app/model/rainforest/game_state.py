from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'tb_rainforest_game'

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
                turn INTEGER DEFAULT 0,
                rainstorm_active INTEGER DEFAULT 0,
                rainstorm_remaining_turns INTEGER DEFAULT 0,
                leaching_remaining_turns INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self) -> int:
        now = datetime.now().isoformat()
        data = {
            'turn': 0,
            'rainstorm_active': 0,
            'rainstorm_remaining_turns': 0,
            'leaching_remaining_turns': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
