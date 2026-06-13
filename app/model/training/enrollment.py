from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EnrollmentModel:
    TABLE_NAME = 'enrollments'

    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_LEAVE = 'leave'
    STATUS_CHECKED_IN = 'checked_in'
    STATUS_COMPLETED = 'completed'

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
                course_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                check_in_time TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee_id ON {cls.TABLE_NAME}(employee_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, course_id: int, employee_id: int, status: str = 'pending') -> int:
        now = datetime.now().isoformat()
        data = {
            'course_id': course_id,
            'employee_id': employee_id,
            'status': status,
            'check_in_time': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_course_and_employee(self, course_id: int, employee_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'course_id': course_id, 'employee_id': employee_id})

    def get_by_employee(self, employee_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('employee_id', employee_id, order_by='created_at DESC')

    def get_by_course(self, course_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('course_id', course_id, order_by='created_at DESC')

    def get_by_status(self, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('status', status, order_by='created_at DESC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def check_in(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CHECKED_IN,
            'check_in_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_course_and_status(self, course_id: int, status: str = None) -> int:
        conditions = {'course_id': course_id}
        if status:
            conditions['status'] = status
        return self.query.count(conditions)

    def get_employee_courses_with_detail(self, employee_id: int):
        sql = """
            SELECT e.*, c.title, c.description, c.instructor, c.datetime, c.location, c.link, c.capacity, c.departments, c.status as course_status
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.employee_id = ?
            ORDER BY c.datetime DESC
        """
        import json
        records = self.db.fetch_all(sql, (employee_id,))
        for record in records:
            if record.get('departments'):
                try:
                    record['departments'] = json.loads(record['departments'])
                except:
                    record['departments'] = []
        return records

    def get_course_employees_with_detail(self, course_id: int):
        sql = """
            SELECT e.*, emp.name, emp.employee_id as emp_no, emp.department
            FROM enrollments e
            JOIN employees emp ON e.employee_id = emp.id
            WHERE e.course_id = ?
            ORDER BY e.created_at ASC
        """
        return self.db.fetch_all(sql, (course_id,))
