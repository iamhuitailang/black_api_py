from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BookModel:
    TABLE_NAME = 'bc_books'

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
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                pages INTEGER DEFAULT 0,
                start_date TEXT DEFAULT '',
                end_date TEXT DEFAULT '',
                rating INTEGER DEFAULT 0,
                review TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_end_date ON {cls.TABLE_NAME}(end_date)"
        db.execute(index_sql2)

    def create(self, user_id: int, title: str, author: str, pages: int = 0,
               start_date: str = '', end_date: str = '', rating: int = 0, review: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'author': author,
            'pages': pages,
            'start_date': start_date,
            'end_date': end_date,
            'rating': rating,
            'review': review,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, book_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(book_id)

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'user_id': user_id}, order_by='id DESC')

    def get_reading_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND (end_date IS NULL OR end_date = '') ORDER BY id DESC"
        return self.db.fetch_all(sql, (user_id,))

    def get_finished_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND end_date IS NOT NULL AND end_date != '' ORDER BY end_date DESC"
        return self.db.fetch_all(sql, (user_id,))

    def get_finished_in_month(self, user_id: int, year_month: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND end_date LIKE ? ORDER BY end_date DESC"
        return self.db.fetch_all(sql, (user_id, f'{year_month}%'))

    def get_latest_all(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='updated_at DESC', limit=limit)

    def update(self, book_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        allowed_fields = ['title', 'author', 'pages', 'start_date', 'end_date', 'rating', 'review']
        for field in allowed_fields:
            if field in kwargs:
                data[field] = kwargs[field]
        return self.exec.update_by_id(book_id, data)

    def delete(self, book_id: int) -> int:
        return self.exec.delete_by_id(book_id)

    def count_finished_by_user_in_month(self, user_id: int, year_month: str) -> int:
        sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE user_id = ? AND end_date LIKE ? AND end_date IS NOT NULL AND end_date != ''"
        row = self.db.fetch_one(sql, (user_id, f'{year_month}%'))
        return row['cnt'] if row else 0
