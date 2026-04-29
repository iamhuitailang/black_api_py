from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_xq_reviews'

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
                from_user_id INTEGER NOT NULL,
                to_user_id INTEGER NOT NULL,
                post_id INTEGER NOT NULL,
                score INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_to_user_id ON {cls.TABLE_NAME}(to_user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)

    def create(self, order_id: int, from_user_id: int, to_user_id: int,
               post_id: int, score: int = 5, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'from_user_id': from_user_id,
            'to_user_id': to_user_id,
            'post_id': post_id,
            'score': max(1, min(5, score)),
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_to_user(self, to_user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'to_user_id': to_user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'post_id': post_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_id': order_id})

    def get_user_average_score(self, user_id: int) -> float:
        sql = f"SELECT AVG(score) as avg_score FROM {self.TABLE_NAME} WHERE to_user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        if result and result.get('avg_score'):
            return round(result['avg_score'], 2)
        return 5.0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'order_id': review.get('order_id'),
            'from_user_id': review.get('from_user_id'),
            'to_user_id': review.get('to_user_id'),
            'post_id': review.get('post_id'),
            'score': review.get('score'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
