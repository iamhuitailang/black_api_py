from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardModel:
    TABLE_NAME = 'tb_corridor_leaderboard'

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
                total_time REAL NOT NULL DEFAULT 0,
                segment1_time REAL DEFAULT 0,
                segment2_time REAL DEFAULT 0,
                segment3_time REAL DEFAULT 0,
                segment4_time REAL DEFAULT 0,
                segment5_time REAL DEFAULT 0,
                weapon_preference TEXT DEFAULT '',
                final_hp INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_time ON {cls.TABLE_NAME}(total_time)"
        db.execute(index_sql)

    def create(self, player_name: str, total_time: float,
               segment_times: List[float], weapon_preference: str,
               final_hp: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'total_time': total_time,
            'segment1_time': segment_times[0] if len(segment_times) > 0 else 0,
            'segment2_time': segment_times[1] if len(segment_times) > 1 else 0,
            'segment3_time': segment_times[2] if len(segment_times) > 2 else 0,
            'segment4_time': segment_times[3] if len(segment_times) > 3 else 0,
            'segment5_time': segment_times[4] if len(segment_times) > 4 else 0,
            'weapon_preference': weapon_preference,
            'final_hp': final_hp,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='total_time ASC', limit=limit)

    def get_all_paginated(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='total_time ASC')

    def count(self) -> int:
        return self.query.count()
