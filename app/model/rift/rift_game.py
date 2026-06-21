from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RiftGameModel:
    TABLE_NAME = 'rift_game'

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
                status TEXT NOT NULL DEFAULT 'playing',
                turn INTEGER NOT NULL DEFAULT 0,
                tracker_x INTEGER NOT NULL DEFAULT 0,
                tracker_y INTEGER NOT NULL DEFAULT 0,
                total_sealed INTEGER NOT NULL DEFAULT 0,
                anchors_available INTEGER NOT NULL DEFAULT 0,
                anchors_deployed INTEGER NOT NULL DEFAULT 0,
                expansion_rate REAL NOT NULL DEFAULT 1.0,
                is_out_of_control INTEGER NOT NULL DEFAULT 0,
                is_shaking INTEGER NOT NULL DEFAULT 0,
                branch_count INTEGER NOT NULL DEFAULT 1,
                score INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql2)

    def create(self, tracker_x: int = 400, tracker_y: int = 300) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': 'playing',
            'turn': 0,
            'tracker_x': tracker_x,
            'tracker_y': tracker_y,
            'total_sealed': 0,
            'anchors_available': 0,
            'anchors_deployed': 0,
            'expansion_rate': 1.0,
            'is_out_of_control': 0,
            'is_shaking': 0,
            'branch_count': 1,
            'score': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def get_active_game(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'status': 'playing'}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def count(self) -> int:
        return self.query.count()
