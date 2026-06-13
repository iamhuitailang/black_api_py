from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class QuizResultModel:
    TABLE_NAME = 'quiz_results'

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
                enrollment_id INTEGER NOT NULL UNIQUE,
                score INTEGER NOT NULL,
                answers TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_enrollment_id ON {cls.TABLE_NAME}(enrollment_id)"
        db.execute(index_sql)

    def create(self, enrollment_id: int, score: int, answers: list = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'enrollment_id': enrollment_id,
            'score': score,
            'answers': json.dumps(answers, ensure_ascii=False) if answers else None,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record and record.get('answers'):
            try:
                record['answers'] = json.loads(record['answers'])
            except:
                record['answers'] = None
        return record

    def get_by_enrollment_id(self, enrollment_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_one({'enrollment_id': enrollment_id})
        if record and record.get('answers'):
            try:
                record['answers'] = json.loads(record['answers'])
            except:
                record['answers'] = None
        return record

    def get_by_employee(self, employee_id: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT qr.*, e.course_id, c.title
            FROM quiz_results qr
            JOIN enrollments e ON qr.enrollment_id = e.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.employee_id = ?
            ORDER BY qr.created_at DESC
        """
        records = self.db.fetch_all(sql, (employee_id,))
        for record in records:
            if record.get('answers'):
                try:
                    record['answers'] = json.loads(record['answers'])
                except:
                    record['answers'] = None
        return records

    def get_average_score_by_employee(self, employee_id: int) -> Optional[float]:
        sql = """
            SELECT AVG(qr.score) as avg_score
            FROM quiz_results qr
            JOIN enrollments e ON qr.enrollment_id = e.id
            WHERE e.employee_id = ?
        """
        result = self.db.fetch_one(sql, (employee_id,))
        return result['avg_score'] if result else None

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
