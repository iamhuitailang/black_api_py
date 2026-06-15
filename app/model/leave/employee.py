from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EmployeeModel:
    TABLE_NAME = 'employees'

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
                department TEXT NOT NULL,
                manager_id INTEGER,
                annual_leave_total INTEGER DEFAULT 10,
                role TEXT DEFAULT 'employee',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str, department: str, manager_id: int = None,
               annual_leave_total: int = 10, role: str = 'employee') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'department': department,
            'manager_id': manager_id,
            'annual_leave_total': annual_leave_total,
            'role': role,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('department', department, order_by='id ASC')

    def get_managers(self) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE role IN ('manager', 'hr', 'admin') ORDER BY id ASC"
        return self.db.fetch_all(sql)

    def get_subordinates(self, manager_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('manager_id', manager_id, order_by='id ASC')

    def get_departments(self) -> List[str]:
        sql = f"SELECT DISTINCT department FROM {self.TABLE_NAME} ORDER BY department"
        rows = self.db.fetch_all(sql)
        return [r['department'] for r in rows]

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
