from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DianyingRatingModel:
    TABLE_NAME = 'tb_dianying_model_rating'

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
                score REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, movie_id)
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def upsert(self, user_id: int, movie_id: int, score: float) -> int:
        existing = self.db.fetch_one(
            f"SELECT id FROM {self.TABLE_NAME} WHERE user_id = ? AND movie_id = ?",
            (user_id, movie_id)
        )
        now = datetime.now().isoformat()
        if existing:
            self.exec.update_by_id(existing['id'], {'score': score, 'updated_at': now})
            return existing['id']
        else:
            data = {
                'user_id': user_id,
                'movie_id': movie_id,
                'score': score,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_movie_rating(self, user_id: int, movie_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'movie_id': movie_id})

    def get_all_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='updated_at DESC')

    def get_all_by_movie(self, movie_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'movie_id': movie_id}, order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_movie(self, user_id: int, movie_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'movie_id': movie_id})
