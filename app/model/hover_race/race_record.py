from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RaceRecordModel:
    TABLE_NAME = 'tb_hover_race_record'

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
                total_time REAL NOT NULL,
                best_lap REAL NOT NULL,
                position INTEGER DEFAULT 1,
                total_laps INTEGER DEFAULT 3,
                track_name TEXT DEFAULT 'Neon Circuit',
                opponents INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_time ON {cls.TABLE_NAME}(total_time)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, player_name: str, total_time: float, best_lap: float,
               position: int = 1, total_laps: int = 3, track_name: str = 'Neon Circuit',
               opponents: int = 3) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'total_time': total_time,
            'best_lap': best_lap,
            'position': position,
            'total_laps': total_laps,
            'track_name': track_name,
            'opponents': opponents,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top_races(self, limit: int = 10, track_name: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if track_name:
            conditions['track_name'] = track_name
        return self.query.find_all(
            conditions=conditions if conditions else None,
            order_by='total_time ASC',
            limit=limit
        )

    def get_player_races(self, player_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'player_name': player_name},
            order_by='created_at DESC',
            limit=limit
        )

    def get_all(self, order_by: str = 'created_at DESC', limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by=order_by, limit=limit)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
