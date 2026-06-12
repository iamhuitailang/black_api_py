from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AsteroidScoreModel:
    TABLE_NAME = 'asteroid_scores'

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
                score INTEGER NOT NULL DEFAULT 0,
                wave INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

    def create(self, player_name: str, score: int, wave: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'score': score,
            'wave': wave,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_top20(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC', limit=20)
