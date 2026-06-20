from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TutorUserProfileModel:
    TABLE_NAME = 'tb_tutor_user_profile'

    ROLE_PARENT = 'parent'
    ROLE_TEACHER = 'teacher'

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
                user_id INTEGER NOT NULL UNIQUE,
                role TEXT NOT NULL,
                real_name TEXT,
                phone TEXT,
                grade TEXT,
                subjects TEXT,
                available_times TEXT,
                introduction TEXT,
                location TEXT,
                budget_min INTEGER DEFAULT 0,
                budget_max INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql2)

    def create(self, user_id: int, role: str, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'role': role,
            'real_name': kwargs.get('real_name', ''),
            'phone': kwargs.get('phone', ''),
            'grade': kwargs.get('grade', ''),
            'subjects': kwargs.get('subjects', ''),
            'available_times': kwargs.get('available_times', ''),
            'introduction': kwargs.get('introduction', ''),
            'location': kwargs.get('location', ''),
            'budget_min': kwargs.get('budget_min', 0),
            'budget_max': kwargs.get('budget_max', 0),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        profile = self.query.find_one({'user_id': user_id})
        if profile:
            if profile.get('subjects'):
                profile['subjects_list'] = [s for s in profile['subjects'].split(',') if s]
            else:
                profile['subjects_list'] = []
            if profile.get('available_times'):
                profile['available_times_list'] = [t for t in profile['available_times'].split(',') if t]
            else:
                profile['available_times_list'] = []
        return profile

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, user_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'updated_at': now
        }
        for key in ['real_name', 'phone', 'grade', 'subjects', 'available_times',
                    'introduction', 'location', 'budget_min', 'budget_max']:
            if key in kwargs:
                data[key] = kwargs[key]
        return self.exec.update(data, conditions={'user_id': user_id})

    def list_teachers(self) -> List[Dict[str, Any]]:
        rows = self.query.find_all({'role': self.ROLE_TEACHER}, order_by='id DESC')
        for row in rows:
            if row.get('subjects'):
                row['subjects_list'] = [s for s in row['subjects'].split(',') if s]
            else:
                row['subjects_list'] = []
            if row.get('available_times'):
                row['available_times_list'] = [t for t in row['available_times'].split(',') if t]
            else:
                row['available_times_list'] = []
        return rows

    def list_parents(self) -> List[Dict[str, Any]]:
        rows = self.query.find_all({'role': self.ROLE_PARENT}, order_by='id DESC')
        for row in rows:
            if row.get('subjects'):
                row['subjects_list'] = [s for s in row['subjects'].split(',') if s]
            else:
                row['subjects_list'] = []
        return rows
