from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GhostModel:
    TABLE_NAME = 'manor_ghost'

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
                ghost_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                position TEXT NOT NULL,
                speed REAL NOT NULL DEFAULT 1.0,
                is_chasing INTEGER NOT NULL DEFAULT 0,
                game_state_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_ghost_id ON {cls.TABLE_NAME}(ghost_id)"
        db.execute(index_sql)

    def create(self, ghost_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'ghost_id': ghost_data['ghost_id'],
            'name': ghost_data['name'],
            'description': ghost_data['description'],
            'position': ghost_data['position'],
            'speed': ghost_data.get('speed', 1.0),
            'is_chasing': ghost_data.get('is_chasing', 0),
            'game_state_id': ghost_data.get('game_state_id'),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_ghost_id(self, ghost_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('ghost_id', ghost_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, ghost_id: str, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update(data, conditions={'ghost_id': ghost_id})

    def delete(self, ghost_id: str) -> int:
        record = self.get_by_ghost_id(ghost_id)
        if record:
            return self.exec.delete_by_id(record['id'])
        return 0
