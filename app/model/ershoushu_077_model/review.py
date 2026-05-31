from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ErshoushuReviewModel:
    TABLE_NAME = 'tb_ershoushu_077_model_review'

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
                trade_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                reviewee_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_trade_id ON {cls.TABLE_NAME}(trade_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer_id ON {cls.TABLE_NAME}(reviewer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewee_id ON {cls.TABLE_NAME}(reviewee_id)"
        db.execute(index_sql)

    def create(self, trade_id: int, reviewer_id: int, reviewee_id: int,
               rating: int, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'trade_id': trade_id,
            'reviewer_id': reviewer_id,
            'reviewee_id': reviewee_id,
            'rating': rating,
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_trade(self, trade_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'trade_id': trade_id}, order_by='created_at DESC')

    def get_by_reviewer(self, reviewer_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reviewer_id': reviewer_id}, order_by='created_at DESC')

    def get_by_reviewee(self, reviewee_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'reviewee_id': reviewee_id}, order_by='created_at DESC')

    def has_reviewed(self, trade_id: int, reviewer_id: int) -> bool:
        return self.query.exists({'trade_id': trade_id, 'reviewer_id': reviewer_id})

    def get_avg_rating(self, user_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE reviewee_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        if result and result['avg_rating'] is not None:
            return round(result['avg_rating'], 1)
        return 5.0

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'trade_id': review.get('trade_id'),
            'reviewer_id': review.get('reviewer_id'),
            'reviewee_id': review.get('reviewee_id'),
            'rating': review.get('rating'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
