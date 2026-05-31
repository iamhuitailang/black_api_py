from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZbtDifferenceModel:
    TABLE_NAME = 'tb_zhaobutong_model_difference'

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
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                radius INTEGER DEFAULT 25,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql)

    def create(self, level_id: int, x: int, y: int, radius: int = 25,
               description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'level_id': level_id,
            'x': x,
            'y': y,
            'radius': radius,
            'description': description,
            'created_at': now
        }
        return self.exec.insert(data)

    def create_batch(self, level_id: int, differences: List[Dict[str, Any]]) -> int:
        data_list = []
        now = datetime.now().isoformat()
        for diff in differences:
            data_list.append({
                'level_id': level_id,
                'x': diff.get('x', 0),
                'y': diff.get('y', 0),
                'radius': diff.get('radius', 25),
                'description': diff.get('description', ''),
                'created_at': now
            })
        return self.exec.insert_many(data_list)

    def get_by_level_id(self, level_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'level_id': level_id}, order_by='id ASC')

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def delete_by_level_id(self, level_id: int) -> int:
        return self.exec.delete({'level_id': level_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update(self, diff_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in ['x', 'y', 'radius', 'description']}
        return self.exec.update_by_id(diff_id, update_data)

    def count_by_level_id(self, level_id: int) -> int:
        return self.query.count({'level_id': level_id})
