from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_skate_score'

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
                player_name TEXT NOT NULL DEFAULT 'Player',
                track_id INTEGER NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                trick_score INTEGER NOT NULL DEFAULT 0,
                time_used REAL NOT NULL DEFAULT 0,
                crash_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_track_id ON {cls.TABLE_NAME}(track_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql2)

    def create(self, player_name: str, track_id: int, score: int, trick_score: int,
               time_used: float, crash_count: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'track_id': track_id,
            'score': score,
            'trick_score': trick_score,
            'time_used': time_used,
            'crash_count': crash_count,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, score_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(score_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.*, t.name as track_name
            FROM {self.TABLE_NAME} s
            LEFT JOIN tb_skate_track t ON s.track_id = t.id
            ORDER BY s.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def get_by_track(self, track_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.*, t.name as track_name
            FROM {self.TABLE_NAME} s
            LEFT JOIN tb_skate_track t ON s.track_id = t.id
            WHERE s.track_id = ?
            ORDER BY s.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (track_id, limit))

    def get_top_scores(self, track_id: int = None, limit: int = 10) -> List[Dict[str, Any]]:
        if track_id:
            return self.get_by_track(track_id, limit)
        return self.get_all(limit)

    def count(self) -> int:
        return self.query.count()

    def delete(self, score_id: int) -> int:
        return self.exec.delete_by_id(score_id)
