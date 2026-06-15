from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StaffModel:
    TABLE_NAME = 'staff'

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
                role TEXT NOT NULL DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, role: str = 'staff') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'role': role,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, staff_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(staff_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_role(self, role: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'role': role}, order_by='id ASC')

    def update(self, staff_id: int, name: str = None, role: str = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if role is not None:
            data['role'] = role
        if not data:
            return 0
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(staff_id, data)

    def delete(self, staff_id: int) -> int:
        return self.exec.delete_by_id(staff_id)

    def count(self) -> int:
        return self.query.count()
