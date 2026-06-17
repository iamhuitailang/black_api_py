from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ParkourScoreModel:
    TABLE_NAME = 'tb_parkour_score'

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
                distance REAL NOT NULL DEFAULT 0,
                letters_collected INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_distance ON {cls.TABLE_NAME}(distance DESC)"
        db.execute(index_sql2)

    def create(self, player_name: str, distance: float, letters_collected: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'distance': distance,
            'letters_collected': letters_collected,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_leaderboard(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='distance DESC', limit=limit)

    def get_best_by_player(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'player_name': player_name},
            order_by='distance DESC'
        )

    def count_by_player(self, player_name: str) -> int:
        return self.query.count(conditions={'player_name': player_name})

    def get_rank(self, distance: float) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE distance > ?"
        result = self.db.fetch_one(sql, (distance,))
        return (result['total'] + 1) if result else 1
