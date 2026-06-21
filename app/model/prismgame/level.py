from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LevelModel:
    TABLE_NAME = 'prism_level'

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                level_number INTEGER NOT NULL,
                difficulty TEXT DEFAULT 'normal',
                light_source_x REAL NOT NULL,
                light_source_y REAL NOT NULL,
                light_source_angle REAL NOT NULL,
                target_x REAL NOT NULL,
                target_y REAL NOT NULL,
                target_radius REAL NOT NULL DEFAULT 30,
                par_rotations INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_number ON {cls.TABLE_NAME}(level_number)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(level_id)

    def get_by_level_number(self, level_number: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'level_number': level_number})

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='level_number ASC', limit=limit)

    def update(self, level_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(level_id, data)

    def delete(self, level_id: int) -> int:
        return self.exec.delete_by_id(level_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='level_number ASC')
