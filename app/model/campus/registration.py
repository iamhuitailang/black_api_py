from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RegistrationModel:
    TABLE_NAME = 'tb_campus_registration'

    STATUS_REGISTERED = 0
    STATUS_CANCELLED = 1

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
                activity_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                student_name TEXT,
                student_no TEXT,
                department TEXT,
                status INTEGER DEFAULT 0,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled_at TIMESTAMP
            )
        """
        db.execute(sql)
        index_sqls = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity ON {cls.TABLE_NAME}(activity_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student ON {cls.TABLE_NAME}(student_id)",
            f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(activity_id, student_id)"
        ]
        for idx_sql in index_sqls:
            db.execute(idx_sql)

    def create(self, data: Dict[str, Any]) -> int:
        data['registered_at'] = datetime.now().isoformat()
        data['status'] = self.STATUS_REGISTERED
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def find_by_activity_and_student(self, activity_id: int, student_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'activity_id': activity_id, 'student_id': student_id})

    def find_by_activity(self, activity_id: int, status: int = None) -> List[Dict[str, Any]]:
        conditions = {'activity_id': activity_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='registered_at DESC')

    def find_by_student(self, student_id: int, status: int = None) -> List[Dict[str, Any]]:
        conditions = {'student_id': student_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='registered_at DESC')

    def count_by_activity(self, activity_id: int, status: int = None) -> int:
        conditions = {'activity_id': activity_id}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)

    def cancel(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {
            'status': self.STATUS_CANCELLED,
            'cancelled_at': datetime.now().isoformat()
        })

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)
