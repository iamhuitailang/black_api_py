from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FeedbackModel:
    TABLE_NAME = 'tb_career_talk_feedback'
    
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
                rating INTEGER DEFAULT 0,
                content TEXT DEFAULT '',
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

    def create(self, talk_id: int, student_id: str, student_name: str = '', 
               rating: int = 0, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'talk_id': talk_id,
            'student_id': student_id,
            'student_name': student_name,
            'rating': rating,
            'content': content,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_talk_and_student(self, talk_id: int, student_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'talk_id': talk_id, 'student_id': student_id})

    def get_by_talk_id(self, talk_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('talk_id', talk_id, order_by='created_at DESC')

    def get_by_student_id(self, student_id: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('student_id', student_id, order_by='created_at DESC')

    def paginate_by_talk(self, talk_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'talk_id': talk_id}, order_by='created_at DESC')

    def update(self, record_id: int, student_name: str = None, rating: int = None, 
               content: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if student_name is not None:
            data['student_name'] = student_name
        if rating is not None:
            data['rating'] = rating
        if content is not None:
            data['content'] = content
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_talk(self, talk_id: int) -> int:
        return self.query.count({'talk_id': talk_id})

    def has_submitted(self, talk_id: int, student_id: str) -> bool:
        return self.query.exists({'talk_id': talk_id, 'student_id': student_id})

    def get_stats(self, talk_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_count,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
            FROM {self.TABLE_NAME}
            WHERE talk_id = ?
        """
        result = self.db.fetch_one(sql, (talk_id,))
        if result:
            return {
                'total_count': result['total_count'] or 0,
                'avg_rating': round(result['avg_rating'] or 0, 1),
                'rating_distribution': {
                    '5': result['rating_5'] or 0,
                    '4': result['rating_4'] or 0,
                    '3': result['rating_3'] or 0,
                    '2': result['rating_2'] or 0,
                    '1': result['rating_1'] or 0
                }
            }
        return {
            'total_count': 0,
            'avg_rating': 0,
            'rating_distribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
        }
