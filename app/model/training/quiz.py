from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class QuizModel:
    TABLE_NAME = 'quizzes'

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
                course_id INTEGER NOT NULL UNIQUE,
                questions TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)

    def create(self, course_id: int, questions: list) -> int:
        now = datetime.now().isoformat()
        data = {
            'course_id': course_id,
            'questions': json.dumps(questions, ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record and record.get('questions'):
            try:
                record['questions'] = json.loads(record['questions'])
            except:
                record['questions'] = []
        return record

    def get_by_course_id(self, course_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_one({'course_id': course_id})
        if record and record.get('questions'):
            try:
                record['questions'] = json.loads(record['questions'])
            except:
                record['questions'] = []
        return record

    def update(self, record_id: int, questions: list) -> int:
        now = datetime.now().isoformat()
        data = {
            'questions': json.dumps(questions, ensure_ascii=False),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def upsert(self, course_id: int, questions: list) -> int:
        now = datetime.now().isoformat()
        data = {
            'course_id': course_id,
            'questions': json.dumps(questions, ensure_ascii=False),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.upsert(data, ['course_id'])

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_course_id(self, course_id: int) -> int:
        return self.exec.delete({'course_id': course_id})
