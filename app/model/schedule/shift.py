from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ShiftModel:
    TABLE_NAME = 'shifts'

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
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT '#cccccc',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, start_time: str, end_time: str, color: str = '#cccccc') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'start_time': start_time,
            'end_time': end_time,
            'color': color,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, shift_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(shift_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, shift_id: int, name: str = None, start_time: str = None,
               end_time: str = None, color: str = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if start_time is not None:
            data['start_time'] = start_time
        if end_time is not None:
            data['end_time'] = end_time
        if color is not None:
            data['color'] = color
        if not data:
            return 0
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(shift_id, data)

    def delete(self, shift_id: int) -> int:
        return self.exec.delete_by_id(shift_id)

    def count(self) -> int:
        return self.query.count()
