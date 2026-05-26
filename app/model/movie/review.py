from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_movie_review'

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
                movie_id INTEGER NOT NULL,
                rating REAL NOT NULL DEFAULT 0,
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_movie_id ON {cls.TABLE_NAME}(movie_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, movie_id: int, rating: float, content: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'movie_id': movie_id,
            'rating': rating,
            'content': content,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['rating', 'content']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_movie_id(self, movie_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.query.paginate(
            page, page_size,
            {'movie_id': movie_id},
            order_by='id DESC'
        )
        return result

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.query.paginate(
            page, page_size,
            {'user_id': user_id},
            order_by='id DESC'
        )
        return result

    def get_user_review_for_movie(self, user_id: int, movie_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'movie_id': movie_id
        }, order_by='id DESC')

    def get_average_rating(self, movie_id: int) -> float:
        sql = f"SELECT COALESCE(AVG(rating), 0) as avg_rating FROM {self.TABLE_NAME} WHERE movie_id = ?"
        result = self.db.fetch_one(sql, (movie_id,))
        return round(result.get('avg_rating', 0), 1) if result else 0

    def count_reviews(self, movie_id: int = None) -> int:
        conditions = {}
        if movie_id is not None:
            conditions['movie_id'] = movie_id
        return self.query.count(conditions)

    def get_all(self, page: int = 1, page_size: int = 10, movie_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if movie_id is not None:
            conditions['movie_id'] = movie_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')