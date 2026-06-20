from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreRankingModel:
    TABLE_NAME = 'tb_shooting_score_ranking'

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
                level_num INTEGER NOT NULL,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                kills INTEGER DEFAULT 0,
                remaining_health INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql_1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_num ON {cls.TABLE_NAME}(level_num)"
        index_sql_2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql_1)
        db.execute(index_sql_2)

    def create(self, level_num: int, player_name: str, score: int,
               kills: int = 0, remaining_health: int = 0, duration: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'level_num': level_num,
            'player_name': player_name,
            'score': score,
            'kills': kills,
            'remaining_health': remaining_health,
            'duration': duration,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_top_by_level(self, level_num: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'level_num': level_num},
            order_by='score DESC, id ASC',
            limit=limit
        )

    def get_all_top(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            order_by='level_num ASC, score DESC, id ASC',
            limit=limit
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, level_num: int = None) -> int:
        if level_num:
            return self.query.count({'level_num': level_num})
        return self.query.count()
