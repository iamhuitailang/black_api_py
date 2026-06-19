from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BuildingModel:
    TABLE_NAME = 'tb_tribe_building'

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
                tribe_id INTEGER NOT NULL,
                building_type TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                is_constructing INTEGER NOT NULL DEFAULT 0,
                progress INTEGER NOT NULL DEFAULT 0,
                total_progress INTEGER NOT NULL DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tribe_id) REFERENCES tb_tribe(id)
            )
        """
        db.execute(sql)
        idx_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tribe_id ON {cls.TABLE_NAME}(tribe_id)"
        db.execute(idx_sql)

    def create(self, tribe_id: int, building_type: str, level: int = 1,
               total_progress: int = 100) -> int:
        now = datetime.now().isoformat()
        data = {
            'tribe_id': tribe_id,
            'building_type': building_type,
            'level': level,
            'is_constructing': 1,
            'progress': 0,
            'total_progress': total_progress,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_tribe(self, tribe_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id}, order_by='id ASC')

    def get_by_tribe_and_type(self, tribe_id: int, building_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id, 'building_type': building_type}, order_by='level DESC')

    def update_progress(self, record_id: int, progress: int, is_constructing: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'progress': progress, 'updated_at': now}
        if is_constructing is not None:
            data['is_constructing'] = is_constructing
        return self.exec.update_by_id(record_id, data)

    def upgrade(self, record_id: int, level: int, total_progress: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'level': level,
            'is_constructing': 1,
            'progress': 0,
            'total_progress': total_progress,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_tribe(self, tribe_id: int) -> int:
        return self.exec.delete({'tribe_id': tribe_id})

    def count_by_tribe_and_type(self, tribe_id: int, building_type: str) -> int:
        return self.query.count({'tribe_id': tribe_id, 'building_type': building_type})
