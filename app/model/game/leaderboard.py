from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardModel:
    TABLE_NAME = 'game_leaderboard'

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
                player_name TEXT NOT NULL DEFAULT 'Anonymous',
                score INTEGER NOT NULL DEFAULT 0,
                time_spent REAL NOT NULL DEFAULT 0,
                hp_remaining INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

    def create(self, player_name: str, score: int, time_spent: float, hp_remaining: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'score': score,
            'time_spent': time_spent,
            'hp_remaining': hp_remaining,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_top(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC, time_spent ASC', limit=limit)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
