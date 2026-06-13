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
                employee_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                role TEXT DEFAULT 'employee',
                password TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN password TEXT DEFAULT ''")
        except Exception:
            pass
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_department ON {cls.TABLE_NAME}(department)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee_id ON {cls.TABLE_NAME}(employee_id)"
        db.execute(index_sql2)

    def create(self, employee_id: str, name: str, department: str, role: str = 'employee', password: str = None) -> int:
        now = datetime.now().isoformat()
        if password is None:
            password = employee_id
        data = {
            'employee_id': employee_id,
            'name': name,
            'department': department,
            'role': role,
            'password': password,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_employee_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'employee_id': employee_id})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('department', department, order_by='name ASC')

    def get_departments(self) -> List[str]:
        sql = f"SELECT DISTINCT department FROM {self.TABLE_NAME} ORDER BY department"
        results = self.db.fetch_all(sql)
        return [r['department'] for r in results]

    def update(self, record_id: int, name: str = None, department: str = None, role: str = None, password: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if name is not None:
            data['name'] = name
        if department is not None:
            data['department'] = department
        if role is not None:
            data['role'] = role
        if password is not None:
            data['password'] = password
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def login(self, employee_id: str, password: str) -> Optional[Dict[str, Any]]:
        employee = self.get_by_employee_id(employee_id)
        if not employee:
            return None
        stored_password = employee.get('password', '')
        if not stored_password:
            stored_password = employee_id
        if password == stored_password:
            result = {k: v for k, v in employee.items() if k != 'password'}
            return result
        return None

    def init_default_employees(self):
        default_employees = [
            {'employee_id': 'HR001', 'name': '张HR', 'department': '人力资源部', 'role': 'hr'},
            {'employee_id': 'EMP001', 'name': '李小明', 'department': '技术部', 'role': 'employee'},
            {'employee_id': 'EMP002', 'name': '王小红', 'department': '技术部', 'role': 'employee'},
            {'employee_id': 'EMP003', 'name': '赵大伟', 'department': '市场部', 'role': 'employee'},
            {'employee_id': 'EMP004', 'name': '孙美丽', 'department': '市场部', 'role': 'employee'},
            {'employee_id': 'EMP005', 'name': '周志强', 'department': '财务部', 'role': 'employee'},
        ]
        for emp in default_employees:
            if not self.query.exists({'employee_id': emp['employee_id']}):
                self.create(**emp)
