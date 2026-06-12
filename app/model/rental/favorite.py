import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_rental_favorites'

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
                listing_id INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(listing_id, session_id)
            )
        """
        db.execute(sql)

        index_sqls = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_session_id ON {cls.TABLE_NAME}(session_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_listing_id ON {cls.TABLE_NAME}(listing_id)",
        ]
        for idx_sql in index_sqls:
            db.execute(idx_sql)

    def add(self, listing_id: int, session_id: str) -> int:
        now = datetime.now().isoformat()
        try:
            return self.exec.insert({
                'listing_id': listing_id,
                'session_id': session_id,
                'created_at': now,
            })
        except Exception:
            return 0

    def remove(self, listing_id: int, session_id: str) -> int:
        return self.exec.delete(conditions={
            'listing_id': listing_id,
            'session_id': session_id,
        })

    def is_favorited(self, listing_id: int, session_id: str) -> bool:
        return self.query.exists({
            'listing_id': listing_id,
            'session_id': session_id,
        })

    def get_list(self, session_id: str) -> List[Dict[str, Any]]:
        from app.model.rental.listing import ListingModel
        listing_table = ListingModel.TABLE_NAME

        sql = f"""
            SELECT l.*, f.created_at as favorited_at
            FROM {self.TABLE_NAME} f
            JOIN {listing_table} l ON f.listing_id = l.id
            WHERE f.session_id = ?
            ORDER BY f.created_at DESC
        """
        rows = self.db.fetch_all(sql, (session_id,))

        result = []
        for row in rows:
            if 'images' in row and isinstance(row['images'], str):
                try:
                    row['images'] = json.loads(row['images'])
                except (json.JSONDecodeError, TypeError):
                    row['images'] = []
            row['is_shared'] = bool(row.get('is_shared', 0))
            row['has_elevator'] = bool(row.get('has_elevator', 0))
            row['has_parking'] = bool(row.get('has_parking', 0))
            result.append(row)

        return result
