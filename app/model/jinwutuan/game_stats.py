from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStatsModel:
    TABLE_NAME = 'tb_jinwutuan_model_game_stats'

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
                user_id INTEGER NOT NULL UNIQUE,
                total_games INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                total_perfect INTEGER DEFAULT 0,
                total_great INTEGER DEFAULT 0,
                total_good INTEGER DEFAULT 0,
                total_miss INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                total_play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_score ON {cls.TABLE_NAME}(total_score)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_max_combo ON {cls.TABLE_NAME}(max_combo)"
        db.execute(index_sql)

    def get_or_create(self, user_id: int) -> Dict[str, Any]:
        stats = self.query.find_one({'user_id': user_id})
        if stats:
            return stats

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'total_games': 0,
            'total_score': 0,
            'total_perfect': 0,
            'total_great': 0,
            'total_good': 0,
            'total_miss': 0,
            'max_combo': 0,
            'total_play_time': 0,
            'created_at': now,
            'updated_at': now
        }
        self.exec.insert(data)
        return self.query.find_one({'user_id': user_id})

    def update_stats(self, user_id: int, data: Dict[str, Any]) -> int:
        stats = self.get_or_create(user_id)
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'total_games', 'total_score', 'total_perfect',
            'total_great', 'total_good', 'total_miss',
            'max_combo', 'total_play_time'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(stats.get('id'), update_data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_top_stats(self, sort_by: str = 'total_score', limit: int = 10) -> List[Dict[str, Any]]:
        allowed_sorts = ['total_score', 'total_games', 'max_combo', 'total_perfect', 'total_play_time']
        if sort_by not in allowed_sorts:
            sort_by = 'total_score'

        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            ORDER BY {sort_by} DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql)

    def increment_stats(self, user_id: int, score: int = 0, perfect: int = 0,
                         great: int = 0, good: int = 0, miss: int = 0,
                         combo: int = 0, play_time: int = 0) -> int:
        stats = self.get_or_create(user_id)

        new_max_combo = max(stats.get('max_combo', 0), combo)
        now = datetime.now().isoformat()

        sql = f"""
            UPDATE {self.TABLE_NAME} SET
                total_games = total_games + 1,
                total_score = total_score + ?,
                total_perfect = total_perfect + ?,
                total_great = total_great + ?,
                total_good = total_good + ?,
                total_miss = total_miss + ?,
                max_combo = ?,
                total_play_time = total_play_time + ?,
                updated_at = ?
            WHERE user_id = ?
        """
        cursor = self.db.execute(sql, (
            score, perfect, great, good, miss,
            new_max_combo, play_time, now, user_id
        ))
        return cursor.rowcount

    def to_dict(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': stats.get('id'),
            'user_id': stats.get('user_id'),
            'total_games': stats.get('total_games'),
            'total_score': stats.get('total_score'),
            'total_perfect': stats.get('total_perfect'),
            'total_great': stats.get('total_great'),
            'total_good': stats.get('total_good'),
            'total_miss': stats.get('total_miss'),
            'max_combo': stats.get('max_combo'),
            'total_play_time': stats.get('total_play_time'),
            'created_at': stats.get('created_at'),
            'updated_at': stats.get('updated_at')
        }
