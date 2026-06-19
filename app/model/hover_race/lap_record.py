from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LapRecordModel:
    TABLE_NAME = 'tb_hover_race_lap_record'

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
                lap_time REAL NOT NULL,
                track_name TEXT DEFAULT 'Neon Circuit',
                lap_number INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_lap_time ON {cls.TABLE_NAME}(lap_time)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, player_name: str, lap_time: float, track_name: str = 'Neon Circuit', lap_number: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'lap_time': lap_time,
            'track_name': track_name,
            'lap_number': lap_number,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top_laps(self, limit: int = 10, track_name: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if track_name:
            conditions['track_name'] = track_name
        return self.query.find_all(
            conditions=conditions if conditions else None,
            order_by='lap_time ASC',
            limit=limit
        )

    def get_player_best(self, player_name: str, track_name: str = None) -> Optional[Dict[str, Any]]:
        conditions = {'player_name': player_name}
        if track_name:
            conditions['track_name'] = track_name
        return self.query.find_one(
            conditions=conditions,
            order_by='lap_time ASC'
        )

    def get_all(self, order_by: str = 'created_at DESC', limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by=order_by, limit=limit)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
