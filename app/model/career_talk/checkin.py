from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'tb_career_talk_checkin'
    
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
                talk_id INTEGER NOT NULL,
                student_id TEXT NOT NULL,
                student_name TEXT DEFAULT '',
                checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_talk_id ON {cls.TABLE_NAME}(talk_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student_id ON {cls.TABLE_NAME}(student_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_talk_student ON {cls.TABLE_NAME}(talk_id, student_id)"
        db.execute(index_sql3)

    def create(self, talk_id: int, student_id: str, student_name: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'talk_id': talk_id,
            'student_id': student_id,
            'student_name': student_name,
            'checkin_time': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_talk_and_student(self, talk_id: int, student_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'talk_id': talk_id, 'student_id': student_id})

    def get_by_talk_id(self, talk_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('talk_id', talk_id, order_by='checkin_time DESC')

    def get_by_student_id(self, student_id: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('student_id', student_id, order_by='checkin_time DESC')

    def paginate_by_talk(self, talk_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'talk_id': talk_id}, order_by='checkin_time DESC')

    def update(self, record_id: int, student_name: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if student_name is not None:
            data['student_name'] = student_name
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_talk(self, talk_id: int) -> int:
        return self.query.count({'talk_id': talk_id})

    def is_checked_in(self, talk_id: int, student_id: str) -> bool:
        return self.query.exists({'talk_id': talk_id, 'student_id': student_id})
