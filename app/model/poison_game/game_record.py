from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'game_records'

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
                player_id TEXT NOT NULL,
                level INTEGER NOT NULL CHECK (level >= 1 AND level <= 12),
                completion_time REAL NOT NULL,
                purification_found INTEGER NOT NULL,
                purification_total INTEGER NOT NULL,
                discovery_rate REAL NOT NULL,
                death_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_time ON {cls.TABLE_NAME}(completion_time)"
        db.execute(index_sql3)

    def create(self, player_id: str, level: int, completion_time: float,
               purification_found: int, purification_total: int,
               death_count: int = 0) -> int:
        discovery_rate = purification_found / purification_total if purification_total > 0 else 0
        data = {
            'player_id': player_id,
            'level': level,
            'completion_time': completion_time,
            'purification_found': purification_found,
            'purification_total': purification_total,
            'discovery_rate': round(discovery_rate, 3),
            'death_count': death_count,
            'created_at': datetime.now().isoformat()
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player(self, player_id: str, level: int = None) -> List[Dict[str, Any]]:
        conditions = {'player_id': player_id}
        if level:
            conditions['level'] = level
        return self.query.find_all(conditions=conditions, order_by='created_at DESC')

    def get_best_by_level(self, player_id: str, level: int) -> Optional[Dict[str, Any]]:
        conditions = {'player_id': player_id, 'level': level}
        return self.query.find_one(conditions=conditions, order_by='completion_time ASC')

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC', limit=limit)

    def count_by_player(self, player_id: str) -> int:
        conditions = {'player_id': player_id}
        return self.query.count(conditions=conditions)

    def paginate(self, player_id: str = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {}
        if player_id:
            conditions['player_id'] = player_id
        return self.query.paginate(page, page_size, conditions=conditions, order_by='created_at DESC')
