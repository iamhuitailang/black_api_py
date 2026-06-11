from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RunnerScoreModel:
    TABLE_NAME = 'runner_scores'

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
                player_name VARCHAR(20) NOT NULL,
                distance INTEGER NOT NULL DEFAULT 0,
                rings INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_distance ON {cls.TABLE_NAME}(distance DESC)"
        db.execute(index_sql)

    def create(self, player_name: str, distance: int, rings: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'distance': distance,
            'rings': rings,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='distance DESC, rings DESC', limit=limit)

    def count(self) -> int:
        return self.query.count()
