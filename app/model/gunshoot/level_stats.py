from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LevelStatsModel:
    TABLE_NAME = 'gunshoot_level_stats'

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
                level_id INTEGER NOT NULL DEFAULT 1,
                cleared INTEGER NOT NULL DEFAULT 0,
                remaining_hp INTEGER NOT NULL DEFAULT 0,
                total_time REAL NOT NULL DEFAULT 0,
                dual_gun_shots INTEGER NOT NULL DEFAULT 0,
                dual_gun_hits INTEGER NOT NULL DEFAULT 0,
                dual_gun_hit_rate REAL NOT NULL DEFAULT 0,
                single_gun_shots INTEGER NOT NULL DEFAULT 0,
                single_gun_hits INTEGER NOT NULL DEFAULT 0,
                single_gun_hit_rate REAL NOT NULL DEFAULT 0,
                stationary_time REAL NOT NULL DEFAULT 0,
                stationary_ratio REAL NOT NULL DEFAULT 0,
                enemies_killed INTEGER NOT NULL DEFAULT 0,
                total_enemies INTEGER NOT NULL DEFAULT 0,
                damage_dealt INTEGER NOT NULL DEFAULT 0,
                damage_taken INTEGER NOT NULL DEFAULT 0,
                reload_count INTEGER NOT NULL DEFAULT 0,
                score INTEGER NOT NULL DEFAULT 0,
                grade TEXT NOT NULL DEFAULT 'D',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def get_by_level(self, level_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'level_id': level_id},
            order_by='score DESC',
            limit=limit
        )

    def get_best_score(self, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'level_id': level_id, 'cleared': 1},
            order_by='score DESC'
        )

    def paginate(self, page: int = 1, page_size: int = 10, level_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if level_id:
            conditions['level_id'] = level_id
        return self.query.paginate(page, page_size, conditions=conditions, order_by='id DESC')
