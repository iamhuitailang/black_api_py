from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_dj_review'

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
                market_id INTEGER,
                booth_id INTEGER,
                item_name TEXT,
                rating INTEGER DEFAULT 5,
                content TEXT,
                images TEXT,
                reply_content TEXT,
                reply_images TEXT,
                status INTEGER DEFAULT 1,
                is_replied INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_booth_id ON {cls.TABLE_NAME}(booth_id)"
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql1)
        db.execute(index_sql2)
        db.execute(index_sql3)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'user_id': data.get('user_id'),
            'market_id': data.get('market_id'),
            'booth_id': data.get('booth_id'),
            'item_name': data.get('item_name'),
            'rating': data.get('rating', 5),
            'content': data.get('content'),
            'images': data.get('images'),
            'status': data.get('status', 1),
            'is_replied': 0,
            'created_at': now,
            'review_time': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_market_id(self, market_id: int, limit: int = None) -> List[Dict[str, Any]]:
        return self.query.find_all({'market_id': market_id, 'status': 1}, order_by='created_at DESC', limit=limit)

    def get_by_booth_id(self, booth_id: int, limit: int = None) -> List[Dict[str, Any]]:
        return self.query.find_all({'booth_id': booth_id, 'status': 1}, order_by='created_at DESC', limit=limit)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='created_at DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def reply(self, record_id: int, reply_content: str, reply_images: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'reply_content': reply_content,
            'reply_images': reply_images,
            'is_replied': 1
        }
        return self.update(record_id, data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)

    def get_market_avg_rating(self, market_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE market_id = ? AND status = 1"
        result = self.db.fetch_one(sql, (market_id,))
        return round(result.get('avg_rating', 0.0), 1) if result else 0.0

    def get_booth_avg_rating(self, booth_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE booth_id = ? AND status = 1"
        result = self.db.fetch_one(sql, (booth_id,))
        return round(result.get('avg_rating', 0.0), 1) if result else 0.0
