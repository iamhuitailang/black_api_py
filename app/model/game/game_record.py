from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'game_record'

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
                clear_time REAL NOT NULL,
                specimen_count INTEGER NOT NULL DEFAULT 0,
                area_cleared INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql_1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_clear_time ON {cls.TABLE_NAME}(clear_time)"
        db.execute(index_sql_1)
        index_sql_2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_specimen_count ON {cls.TABLE_NAME}(specimen_count)"
        db.execute(index_sql_2)

    def create(self, player_name: str, clear_time: float, specimen_count: int = 0, area_cleared: int = 0) -> int:
        data = {
            'player_name': player_name,
            'clear_time': clear_time,
            'specimen_count': specimen_count,
            'area_cleared': area_cleared,
            'created_at': datetime.now().isoformat()
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_fastest(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='clear_time ASC, specimen_count DESC', limit=limit)

    def get_most_specimens(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='specimen_count DESC, clear_time ASC', limit=limit)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10, order_by: str = 'clear_time ASC') -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by=order_by)
