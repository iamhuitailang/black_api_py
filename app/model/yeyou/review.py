from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_yeyou_reviews'

    STATUS_ACTIVE = 0
    STATUS_HIDDEN = 1

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
                activity_id INTEGER NOT NULL,
                reviewer_id INTEGER NOT NULL,
                target_user_id INTEGER NOT NULL,
                rating INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(activity_id, reviewer_id, target_user_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer ON {cls.TABLE_NAME}(reviewer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_user_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, reviewer_id: int, target_user_id: int,
               rating: int = 5, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'reviewer_id': reviewer_id,
            'target_user_id': target_user_id,
            'rating': max(1, min(5, rating)),
            'content': content or '',
            'status': self.STATUS_ACTIVE,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_activity_and_reviewer(self, activity_id: int, reviewer_id: int) -> List[Dict[str, Any]]:
        return self.query.find_many({'activity_id': activity_id, 'reviewer_id': reviewer_id})

    def get_by_target_user(self, target_user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {
            'target_user_id': target_user_id,
            'status': self.STATUS_ACTIVE
        }
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_activity(self, activity_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {
            'activity_id': activity_id,
            'status': self.STATUS_ACTIVE
        }
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def update_status(self, record_id: int, status: int) -> int:
        return self.exec.update_by_id(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_average_rating(self, user_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE target_user_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (user_id, self.STATUS_ACTIVE))
        if result and result.get('avg_rating'):
            return round(float(result['avg_rating']), 1)
        return 0.0

    def to_public_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'activity_id': review.get('activity_id'),
            'reviewer_id': review.get('reviewer_id'),
            'target_user_id': review.get('target_user_id'),
            'rating': review.get('rating'),
            'content': review.get('content'),
            'status': review.get('status'),
            'created_at': review.get('created_at')
        }
