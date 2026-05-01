from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_feipin_reviews'

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
                order_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                collector_id INTEGER NOT NULL,
                score INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_collector_id ON {cls.TABLE_NAME}(collector_id)"
        db.execute(index_sql)

    def create(self, order_id: int, user_id: int, collector_id: int,
               score: int = 5, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'user_id': user_id,
            'collector_id': collector_id,
            'score': max(1, min(5, score)),
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_id': order_id})

    def get_by_collector_id(self, collector_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'collector_id': collector_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_collector_rating(self, collector_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as review_count,
                COALESCE(AVG(score), 5.0) as avg_score
            FROM {self.TABLE_NAME}
            WHERE collector_id = ?
        """
        result = self.db.fetch_one(sql, (collector_id,))
        if result:
            return {
                'review_count': result['review_count'],
                'avg_score': round(result['avg_score'], 1)
            }
        return {'review_count': 0, 'avg_score': 5.0}

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'order_id': review.get('order_id'),
            'user_id': review.get('user_id'),
            'collector_id': review.get('collector_id'),
            'score': review.get('score'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
