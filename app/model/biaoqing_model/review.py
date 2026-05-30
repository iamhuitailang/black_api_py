from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_biaoqing_model_reviews'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2

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
                user_id INTEGER NOT NULL,
                emoji_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                rating INTEGER DEFAULT 5,
                status INTEGER DEFAULT 1,
                like_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_emoji ON {cls.TABLE_NAME}(emoji_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, emoji_id: int, content: str, rating: int = 5) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'emoji_id': emoji_id,
            'content': content,
            'rating': max(1, min(5, rating)),
            'status': self.STATUS_APPROVED,
            'like_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'status': status, 'updated_at': now})

    def increment_like(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + 1 WHERE id = ?"
        return self.exec.execute_raw(sql, (record_id,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_emoji_id(self, emoji_id: int, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        conditions = {'emoji_id': emoji_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')

    def to_dict(self, review: Dict[str, Any], include_user: bool = False) -> Dict[str, Any]:
        result = {
            'id': review.get('id'),
            'user_id': review.get('user_id'),
            'emoji_id': review.get('emoji_id'),
            'content': review.get('content'),
            'rating': review.get('rating'),
            'status': review.get('status'),
            'status_text': self.get_status_text(review.get('status')),
            'like_count': review.get('like_count'),
            'created_at': review.get('created_at')
        }
        if include_user:
            from app.model.biaoqing_model.user import UserModel
            user_model = UserModel()
            user = user_model.get_by_id(review.get('user_id'))
            if user:
                result['user'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
        return result
