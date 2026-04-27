from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_dd_reviews'
    
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
                task_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                reviewed_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer_id ON {cls.TABLE_NAME}(reviewer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewed_id ON {cls.TABLE_NAME}(reviewed_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_reviewer ON {cls.TABLE_NAME}(task_id, reviewer_id)"
        db.execute(index_sql)

    def create(self, task_id: int, reviewer_id: int, reviewed_id: int, 
               rating: int, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'task_id': task_id,
            'reviewer_id': reviewer_id,
            'reviewed_id': reviewed_id,
            'rating': max(1, min(5, rating)),
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_task(self, task_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'task_id': task_id}, order_by='created_at DESC')

    def get_by_reviewer(self, reviewer_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reviewer_id': reviewer_id}, order_by='created_at DESC')

    def get_by_reviewed(self, reviewed_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reviewed_id': reviewed_id}, order_by='created_at DESC')

    def get_by_task_and_reviewer(self, task_id: int, reviewer_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'task_id': task_id, 'reviewer_id': reviewer_id})

    def has_reviewed(self, task_id: int, reviewer_id: int) -> bool:
        return self.get_by_task_and_reviewer(task_id, reviewer_id) is not None

    def get_average_rating(self, reviewed_id: int) -> float:
        sql = f"""
            SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} 
            WHERE reviewed_id = ?
        """
        result = self.db.fetch_one(sql, (reviewed_id,))
        return result['avg_rating'] if result and result['avg_rating'] else 0.0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
