from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardModel:
    TABLE_NAME = 'tb_racing_leaderboard'

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
                vehicle_id INTEGER NOT NULL,
                player_name TEXT NOT NULL,
                total_time REAL NOT NULL,
                total_gold INTEGER DEFAULT 0,
                total_shortcuts INTEGER DEFAULT 0,
                total_rollovers INTEGER DEFAULT 0,
                rank INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES tb_racing_vehicle(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_time ON {cls.TABLE_NAME}(total_time ASC)"
        db.execute(index_sql)

    def create(self, vehicle_id: int, player_name: str, total_time: float,
               total_gold: int = 0, total_shortcuts: int = 0, total_rollovers: int = 0) -> int:
        data = {
            'vehicle_id': vehicle_id,
            'player_name': player_name,
            'total_time': total_time,
            'total_gold': total_gold,
            'total_shortcuts': total_shortcuts,
            'total_rollovers': total_rollovers,
            'created_at': datetime.now().isoformat()
        }
        record_id = self.exec.insert(data)
        self.update_ranks()
        return record_id

    def update_ranks(self) -> None:
        sql = f"""
            UPDATE {self.TABLE_NAME} SET rank = (
                SELECT COUNT(*) + 1 FROM {self.TABLE_NAME} lb2
                WHERE lb2.total_time < {self.TABLE_NAME}.total_time
            )
        """
        self.exec.execute_raw(sql)

    def get_top(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            order_by='rank ASC, id ASC',
            limit=limit
        )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='rank ASC, id ASC')

    def get_by_vehicle(self, vehicle_id: int) -> Optional[Dict[str, Any]]:
        results = self.query.find_all(conditions={'vehicle_id': vehicle_id}, limit=1, order_by='id DESC')
        return results[0] if results else None
