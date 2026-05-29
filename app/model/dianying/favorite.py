from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DianyingFavoriteModel:
    TABLE_NAME = 'tb_dianying_model_favorite'

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, movie_id)
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def add(self, user_id: int, movie_id: int) -> int:
        existing = self.db.fetch_one(
            f"SELECT id FROM {self.TABLE_NAME} WHERE user_id = ? AND movie_id = ?",
            (user_id, movie_id)
        )
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        data = {'user_id': user_id, 'movie_id': movie_id, 'created_at': now}
        return self.exec.insert(data)

    def is_favorite(self, user_id: int, movie_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'movie_id': movie_id})

    def get_user_favorite_ids(self, user_id: int) -> List[int]:
        rows = self.query.find_all({'user_id': user_id})
        return [r['movie_id'] for r in rows]

    def get_user_favorites(self, user_id: int) -> List[Dict[str, Any]]:
        from app.model.dianying.movie import DianyingMovieModel
        movie_model = DianyingMovieModel()
        ids = self.get_user_favorite_ids(user_id)
        if not ids:
            return []
        placeholders = ','.join(['?' for _ in ids])
        return self.db.fetch_all(
            f"SELECT * FROM {movie_model.TABLE_NAME} WHERE id IN ({placeholders}) ORDER BY rating DESC",
            tuple(ids)
        )

    def remove(self, user_id: int, movie_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'movie_id': movie_id})
