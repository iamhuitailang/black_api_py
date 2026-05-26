from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_audio_favorites'

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
                song_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song ON {cls.TABLE_NAME}(song_id)"
        db.execute(index_sql)

    def add(self, song_id: int) -> int:
        existing = self.query.find_one({'song_id': song_id})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        data = {
            'song_id': song_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def remove(self, song_id: int) -> int:
        return self.exec.delete({'song_id': song_id})

    def is_favorited(self, song_id: int) -> bool:
        return self.query.exists({'song_id': song_id})

    def get_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        sql = f"""
            SELECT f.*, s.title, s.artist, s.album, s.duration, s.genre, s.cover, s.popularity
            FROM {self.TABLE_NAME} f
            JOIN tb_audio_songs s ON f.song_id = s.id
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        """
        items = self.db.fetch_all(sql, (page_size, (page - 1) * page_size))
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_all_song_ids(self) -> List[int]:
        records = self.query.find_all(order_by='created_at DESC')
        return [r['song_id'] for r in records]

    def count(self) -> int:
        return self.query.count()