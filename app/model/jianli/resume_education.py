from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ResumeEducationModel:
    TABLE_NAME = 'tb_jianli_resume_educations'

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
                resume_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                school_name TEXT NOT NULL,
                major TEXT DEFAULT '',
                degree TEXT DEFAULT '',
                start_date TEXT DEFAULT '',
                end_date TEXT DEFAULT '',
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_resume_id ON {cls.TABLE_NAME}(resume_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, resume_id: int, user_id: int, school_name: str, major: str = '',
               degree: str = '', start_date: str = '', end_date: str = '',
               description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'resume_id': resume_id,
            'user_id': user_id,
            'school_name': school_name,
            'major': major,
            'degree': degree,
            'start_date': start_date,
            'end_date': end_date,
            'description': description,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_resume_id(self, resume_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'resume_id': resume_id},
            order_by='sort_order ASC, id DESC'
        )

    def get_by_user_and_id(self, user_id: int, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'id': record_id, 'user_id': user_id})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'school_name', 'major', 'degree', 'start_date', 'end_date',
            'description', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_resume_id(self, resume_id: int) -> int:
        return self.exec.delete({'resume_id': resume_id})

    def to_public_dict(self, education: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': education.get('id'),
            'resume_id': education.get('resume_id'),
            'user_id': education.get('user_id'),
            'school_name': education.get('school_name'),
            'major': education.get('major'),
            'degree': education.get('degree'),
            'start_date': education.get('start_date'),
            'end_date': education.get('end_date'),
            'description': education.get('description'),
            'sort_order': education.get('sort_order'),
            'created_at': education.get('created_at')
        }
