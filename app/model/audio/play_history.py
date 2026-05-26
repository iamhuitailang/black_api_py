from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayHistoryModel:
    TABLE_NAME = 'tb_audio_play_history'
    MAX_RECORDS = 200

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
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song ON {cls.TABLE_NAME}(song_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_played ON {cls.TABLE_NAME}(played_at)"
        db.execute(index_sql)

    def add(self, song_id: int) -> int:
        self.exec.delete({'song_id': song_id})
        now = datetime.now().isoformat()
        data = {
            'song_id': song_id,
            'played_at': now
        }
        record_id = self.exec.insert(data)
        self._trim_history()
        return record_id

    def _trim_history(self):
        count = self.query.count()
        if count > self.MAX_RECORDS:
            excess = count - self.MAX_RECORDS
            sql = f"""
                DELETE FROM {self.TABLE_NAME}
                WHERE id IN (
                    SELECT id FROM {self.TABLE_NAME}
                    ORDER BY played_at ASC
                    LIMIT ?
                )
            """
            self.db.execute(sql, (excess,))

    def get_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        sql = f"""
            SELECT h.*, s.title, s.artist, s.album, s.duration, s.genre, s.cover, s.popularity
            FROM {self.TABLE_NAME} h
            JOIN tb_audio_songs s ON h.song_id = s.id
            ORDER BY h.played_at DESC
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

    def clear(self) -> int:
        return self.exec.execute_raw(f"DELETE FROM {self.TABLE_NAME}")

    def count(self) -> int:
        return self.query.count()