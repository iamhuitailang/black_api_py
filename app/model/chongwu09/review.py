from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_chongwu09_model_review'

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
                service_id INTEGER NOT NULL,
                order_id INTEGER NOT NULL,
                rating INTEGER NOT NULL DEFAULT 5,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_service_id ON {cls.TABLE_NAME}(service_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)

    def create(self, user_id: int, service_id: int, order_id: int,
               rating: int, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'service_id': service_id,
            'order_id': order_id,
            'rating': rating,
            'content': content,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_service(self, service_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'service_id': service_id}, order_by='id DESC')

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'user_id': user_id}, order_by='id DESC')

    def get_by_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_id': order_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_service_avg_rating(self, service_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE service_id = ?"
        result = self.db.fetch_one(sql, (service_id,))
        return round(result['avg_rating'], 1) if result and result['avg_rating'] else 0.0

    def get_service_rating_count(self, service_id: int) -> int:
        return self.query.count({'service_id': service_id})

    def to_dict(self, review: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': review.get('id'),
            'user_id': review.get('user_id'),
            'service_id': review.get('service_id'),
            'order_id': review.get('order_id'),
            'rating': review.get('rating'),
            'content': review.get('content'),
            'created_at': review.get('created_at')
        }
