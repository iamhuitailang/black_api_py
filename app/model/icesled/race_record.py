from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RaceRecordModel:
    TABLE_NAME = 'icesled_race_record'

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
                track_template_id INTEGER,
                track_name TEXT NOT NULL,
                player_name TEXT NOT NULL DEFAULT '玩家',
                total_time REAL NOT NULL,
                winner_name TEXT NOT NULL,
                winner_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'finished',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_time ON {cls.TABLE_NAME}(total_time)"
        db.execute(index_sql2)

    def create(self, track_template_id: Optional[int], track_name: str,
               player_name: str, total_time: float, winner_name: str,
               winner_type: str, status: str = 'finished') -> int:
        now = datetime.now().isoformat()
        data = {
            'track_template_id': track_template_id,
            'track_name': track_name,
            'player_name': player_name,
            'total_time': total_time,
            'winner_name': winner_name,
            'winner_type': winner_type,
            'status': status,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def get_latest(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC', limit=limit)

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='created_at DESC')

    def count(self) -> int:
        return self.query.count()

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
