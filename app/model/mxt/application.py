from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ApplicationModel:
    TABLE_NAME = 'tb_mxt_application'
    
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
                job_id INTEGER NOT NULL,
                applicant_name TEXT NOT NULL,
                age INTEGER DEFAULT 18,
                has_experience INTEGER DEFAULT 0,
                specialties TEXT DEFAULT '',
                reason TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                hr_reply TEXT DEFAULT '',
                is_urgent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_job_id ON {cls.TABLE_NAME}(job_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql3)

    def create(self, job_id: int, applicant_name: str, age: int = 18,
               has_experience: int = 0, specialties: str = '',
               reason: str = '', status: str = 'pending',
               hr_reply: str = '', is_urgent: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'job_id': job_id,
            'applicant_name': applicant_name,
            'age': age,
            'has_experience': has_experience,
            'specialties': specialties,
            'reason': reason,
            'status': status,
            'hr_reply': hr_reply,
            'is_urgent': is_urgent,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_job_id(self, job_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('job_id', job_id, order_by='created_at DESC')

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC')

    def get_by_status(self, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'status': status}, order_by='created_at DESC')

    def update(self, record_id: int, status: str = None, hr_reply: str = None,
               is_urgent: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if status is not None:
            data['status'] = status
        if hr_reply is not None:
            data['hr_reply'] = hr_reply
        if is_urgent is not None:
            data['is_urgent'] = is_urgent
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
