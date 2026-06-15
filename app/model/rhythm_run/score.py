from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RhythmRunScoreModel:
    TABLE_NAME = 'rhythm_run_scores'

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
                player_name TEXT NOT NULL,
                song TEXT NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                max_combo INTEGER NOT NULL DEFAULT 0,
                rating TEXT NOT NULL DEFAULT 'C',
                perfect_count INTEGER NOT NULL DEFAULT 0,
                good_count INTEGER NOT NULL DEFAULT 0,
                miss_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song_score ON {cls.TABLE_NAME}(song, score DESC)"
        db.execute(index_sql)

    def create(self, player_name: str, song: str, score: int, max_combo: int,
               rating: str, perfect_count: int, good_count: int, miss_count: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'song': song,
            'score': score,
            'max_combo': max_combo,
            'rating': rating,
            'perfect_count': perfect_count,
            'good_count': good_count,
            'miss_count': miss_count,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_leaderboard(self, song: str, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'song': song} if song else None,
            order_by='score DESC, max_combo DESC, created_at ASC',
            limit=limit
        )

    def get_player_best(self, player_name: str, song: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'player_name': player_name, 'song': song},
            order_by='score DESC'
        )
