from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PrismModel:
    TABLE_NAME = 'prism_prism'

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
                level_id INTEGER NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                rotation REAL NOT NULL DEFAULT 0,
                sides INTEGER NOT NULL DEFAULT 6,
                size REAL NOT NULL DEFAULT 40,
                is_rotatable INTEGER NOT NULL DEFAULT 1,
                color_filter TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def create_batch(self, prisms: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        for p in prisms:
            p['created_at'] = now
            p['updated_at'] = now
        return self.exec.insert_many(prisms)

    def get_by_id(self, prism_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(prism_id)

    def get_by_level_id(self, level_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'level_id': level_id}, order_by='id ASC')

    def update(self, prism_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(prism_id, data)

    def delete(self, prism_id: int) -> int:
        return self.exec.delete_by_id(prism_id)

    def delete_by_level_id(self, level_id: int) -> int:
        return self.exec.delete({'level_id': level_id})

    def count_by_level_id(self, level_id: int) -> int:
        return self.query.count({'level_id': level_id})
