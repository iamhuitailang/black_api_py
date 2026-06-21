from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'tb_campus_checkin'

    STATUS_CHECKED = 1
    STATUS_ABSENT = 0

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
                registration_id INTEGER,
                student_id INTEGER NOT NULL,
                student_name TEXT,
                student_no TEXT,
                status INTEGER DEFAULT 1,
                checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checkin_method TEXT DEFAULT 'qrcode'
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
        data['checkin_time'] = datetime.now().isoformat()
        if 'status' not in data:
            data['status'] = self.STATUS_CHECKED
        return self.exec.upsert(data, ['activity_id', 'student_id'])

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def find_by_activity_and_student(self, activity_id: int, student_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'activity_id': activity_id, 'student_id': student_id})

    def find_by_activity(self, activity_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'activity_id': activity_id}, order_by='checkin_time DESC')

    def count_checked(self, activity_id: int) -> int:
        return self.query.count({'activity_id': activity_id, 'status': self.STATUS_CHECKED})

    def mark_absent(self, activity_id: int, student_id: int) -> int:
        existing = self.find_by_activity_and_student(activity_id, student_id)
        if existing:
            return self.exec.update_by_id(existing['id'], {'status': self.STATUS_ABSENT})
        return self.exec.insert({
            'activity_id': activity_id,
            'student_id': student_id,
            'status': self.STATUS_ABSENT,
            'checkin_time': datetime.now().isoformat()
        })
