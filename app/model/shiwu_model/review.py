from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_shiwu_model_reviews'

    TYPE_CLAIM = 'claim'
    TYPE_CLUE = 'clue'

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
                post_id INTEGER NOT NULL,
                related_id INTEGER NOT NULL,
                related_type TEXT NOT NULL,
                reviewer_id INTEGER NOT NULL,
                reviewed_id INTEGER NOT NULL,
                rating INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_related ON {cls.TABLE_NAME}(related_id, related_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewer ON {cls.TABLE_NAME}(reviewer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reviewed ON {cls.TABLE_NAME}(reviewed_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(post_id, reviewer_id, reviewed_id, related_type)"
        db.execute(index_sql)

    def create(self, post_id: int, related_id: int, related_type: str,
               reviewer_id: int, reviewed_id: int, rating: int = 5, 
               content: str = '') -> int:
        existing = self.get_by_unique(post_id, reviewer_id, reviewed_id, related_type)
        if existing:
            return 0
        
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'related_id': related_id,
            'related_type': related_type,
            'reviewer_id': reviewer_id,
            'reviewed_id': reviewed_id,
            'rating': max(1, min(5, rating)),
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_unique(self, post_id: int, reviewer_id: int, reviewed_id: int, 
                      related_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'post_id': post_id,
            'reviewer_id': reviewer_id,
            'reviewed_id': reviewed_id,
            'related_type': related_type
        })

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'post_id': post_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_reviewer(self, reviewer_id: int, page: int = 1, page_size: int = 10,
                        related_type: str = None) -> Dict[str, Any]:
        conditions = {'reviewer_id': reviewer_id}
        if related_type:
            conditions['related_type'] = related_type
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_reviewed(self, reviewed_id: int, page: int = 1, page_size: int = 10,
                        related_type: str = None) -> Dict[str, Any]:
        conditions = {'reviewed_id': reviewed_id}
        if related_type:
            conditions['related_type'] = related_type
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_average_rating(self, user_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE reviewed_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        avg = result.get('avg_rating', 0) if result else 0
        return round(avg, 2) if avg else 0

    def get_rating_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE reviewed_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('count', 0) if result else 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.shiwu_model.user import UserModel
        user_model = UserModel()
        
        reviewer = user_model.get_by_id(review.get('reviewer_id', 0))
        reviewed = user_model.get_by_id(review.get('reviewed_id', 0))
        
        return {
            'id': review.get('id'),
            'post_id': review.get('post_id'),
            'related_id': review.get('related_id'),
            'related_type': review.get('related_type'),
            'reviewer_id': review.get('reviewer_id'),
            'reviewer': user_model.to_simple_dict(reviewer) if reviewer else None,
            'reviewed_id': review.get('reviewed_id'),
            'reviewed': user_model.to_simple_dict(reviewed) if reviewed else None,
            'rating': review.get('rating'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
