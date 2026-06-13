from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ArcherScoreModel:
    TABLE_NAME = 'archer_scores'

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
                wave INTEGER NOT NULL DEFAULT 0,
                score INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

        index_wave = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_wave ON {cls.TABLE_NAME}(wave DESC)"
        db.execute(index_wave)

    def create(self, player_name: str, wave: int, score: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'wave': wave,
            'score': score,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC, wave DESC', limit=limit)

    def get_player_best(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'player_name': player_name},
            order_by='score DESC, wave DESC'
        )

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='score DESC, wave DESC')
