from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseModel:
    TABLE_NAME = 'tb_tutor_course'

    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
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
                demand_id INTEGER,
                parent_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                grade TEXT,
                course_date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT,
                price INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_teacher_id ON {cls.TABLE_NAME}(teacher_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_date ON {cls.TABLE_NAME}(course_date)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql4)

    def create(self, parent_id: int, teacher_id: int, subject: str,
               course_date: str, start_time: str, end_time: str, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'parent_id': parent_id,
            'teacher_id': teacher_id,
            'subject': subject,
            'grade': kwargs.get('grade', ''),
            'demand_id': kwargs.get('demand_id'),
            'course_date': course_date,
            'start_time': start_time,
            'end_time': end_time,
            'location': kwargs.get('location', ''),
            'price': kwargs.get('price', 0),
            'status': self.STATUS_PENDING,
            'notes': kwargs.get('notes', ''),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_parent_id(self, parent_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'parent_id': parent_id}, order_by='course_date DESC, start_time ASC')

    def get_by_teacher_id(self, teacher_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'teacher_id': teacher_id}, order_by='course_date DESC, start_time ASC')

    def get_by_date_range(self, user_id: int, role: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        if role == 'parent':
            condition_field = 'parent_id'
        else:
            condition_field = 'teacher_id'
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {condition_field} = ? AND course_date >= ? AND course_date <= ?
            ORDER BY course_date ASC, start_time ASC
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'updated_at': now
        }
        for key in ['subject', 'grade', 'course_date', 'start_time', 'end_time',
                    'location', 'price', 'status', 'notes']:
            if key in kwargs:
                data[key] = kwargs[key]
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def has_conflict(self, user_id: int, role: str, course_date: str,
                     start_time: str, end_time: str, exclude_id: int = None) -> bool:
        if role == 'parent':
            condition_field = 'parent_id'
        else:
            condition_field = 'teacher_id'

        sql = f"""
            SELECT id FROM {self.TABLE_NAME}
            WHERE {condition_field} = ?
              AND course_date = ?
              AND status != 'cancelled'
              AND ((start_time < ? AND end_time > ?)
                   OR (start_time < ? AND end_time > ?)
                   OR (start_time >= ? AND end_time <= ?))
        """
        params = [user_id, course_date, end_time, start_time, end_time, start_time, start_time, end_time]

        if exclude_id:
            sql += " AND id != ?"
            params.append(exclude_id)

        rows = self.db.fetch_all(sql, tuple(params))
        return len(rows) > 0
