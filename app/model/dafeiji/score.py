from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_dafeiji_score'

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
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                wave INTEGER NOT NULL,
                plane_id TEXT NOT NULL,
                kills INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_score = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_score)

        index_date = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_date)

        index_user = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_user)

    def add_score(self, user_id: int, username: str, score: int, wave: int,
                  plane_id: str, kills: int = 0, play_time: int = 0) -> int:
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        data = {
            'user_id': user_id,
            'username': username,
            'score': score,
            'wave': wave,
            'plane_id': plane_id,
            'kills': kills,
            'play_time': play_time,
            'date': date_str,
            'created_at': now.isoformat()
        }
        return self.exec.insert(data)

    def get_daily_top(self, date_str: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        if date_str is None:
            date_str = datetime.now().strftime('%Y-%m-%d')
        sql = f"""
            SELECT s.*, 
                   ROW_NUMBER() OVER (ORDER BY s.score DESC) as rank
            FROM {self.TABLE_NAME} s
            WHERE s.date = ?
            ORDER BY s.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (date_str, limit))

    def get_weekly_top(self, limit: int = 50) -> List[Dict[str, Any]]:
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        week_start_str = week_start.strftime('%Y-%m-%d')
        sql = f"""
            SELECT s.user_id, s.username, s.plane_id,
                   MAX(s.score) as score,
                   MAX(s.wave) as wave,
                   SUM(s.kills) as kills,
                   ROW_NUMBER() OVER (ORDER BY MAX(s.score) DESC) as rank
            FROM {self.TABLE_NAME} s
            WHERE s.date >= ?
            GROUP BY s.user_id, s.username, s.plane_id
            ORDER BY score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (week_start_str, limit))

    def get_all_time_top(self, limit: int = 50) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.user_id, s.username, s.plane_id,
                   MAX(s.score) as score,
                   MAX(s.wave) as wave,
                   SUM(s.kills) as kills,
                   ROW_NUMBER() OVER (ORDER BY MAX(s.score) DESC) as rank
            FROM {self.TABLE_NAME} s
            GROUP BY s.user_id, s.username, s.plane_id
            ORDER BY score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def get_user_best(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ?
            ORDER BY score DESC
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def get_user_scores(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def verify_score_reasonable(self, score: int, wave: int, kills: int, play_time: int) -> bool:
        if score < 0 or wave < 1 or kills < 0 or play_time < 0:
            return False
        if play_time > 7200:
            return False
        if kills > 0 and score / kills > 1000:
            return False
        if wave > 0 and score / wave > 50000:
            return False
        return True
