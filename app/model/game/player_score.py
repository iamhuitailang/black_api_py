from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerScoreModel:
    TABLE_NAME = 'player_score'

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
                wave INTEGER NOT NULL DEFAULT 1,
                kills INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, player_name: str, score: int, wave: int, kills: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'score': score,
            'wave': wave,
            'kills': kills,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC', limit=limit)

    def get_by_player_name(self, player_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'player_name': player_name},
            order_by='score DESC'
        )

    def get_highest_by_player(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'player_name': player_name},
            order_by='score DESC'
        )

    def update(self, record_id: int, score: int, wave: int, kills: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'score': score,
            'wave': wave,
            'kills': kills,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='score DESC')
