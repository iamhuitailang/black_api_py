from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaveRequestModel:
    TABLE_NAME = 'leave_requests'

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

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
                enrollment_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee_id ON {cls.TABLE_NAME}(employee_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql3)

    def create(self, enrollment_id: int, course_id: int, employee_id: int, reason: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'enrollment_id': enrollment_id,
            'course_id': course_id,
            'employee_id': employee_id,
            'reason': reason,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions=conditions, order_by='created_at DESC')

    def get_with_details(self, status: str = None) -> List[Dict[str, Any]]:
        conditions_sql = ""
        params = []
        if status:
            conditions_sql = "WHERE lr.status = ?"
            params.append(status)
        sql = f"""
            SELECT lr.*, e.name as employee_name, e.employee_id as emp_no, e.department,
                   c.title as course_title, c.datetime as course_datetime
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN courses c ON lr.course_id = c.id
            {conditions_sql}
            ORDER BY lr.created_at DESC
        """
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def get_by_employee(self, employee_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('employee_id', employee_id, order_by='created_at DESC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: str = None) -> int:
        conditions = {}
        if status:
            conditions['status'] = status
        return self.query.count(conditions)
