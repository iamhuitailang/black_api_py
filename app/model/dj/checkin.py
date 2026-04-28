from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'tb_dj_checkin'

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
                user_id INTEGER NOT NULL,
                market_id INTEGER NOT NULL,
                checkin_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, market_id, checkin_date)
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_checkin_date ON {cls.TABLE_NAME}(checkin_date)"
        db.execute(index_sql1)
        db.execute(index_sql2)
        db.execute(index_sql3)

    def create(self, user_id: int, market_id: int) -> int:
        now = datetime.now().isoformat()
        checkin_date = date.today().isoformat()
        data = {
            'user_id': user_id,
            'market_id': market_id,
            'checkin_date': checkin_date,
            'created_at': now
        }
        try:
            return self.exec.insert(data)
        except Exception:
            return 0

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, limit: int = None) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='checkin_date DESC', limit=limit)

    def get_by_user_and_market(self, user_id: int, market_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'market_id': market_id}, order_by='checkin_date DESC')

    def has_checked_in_today(self, user_id: int, market_id: int) -> bool:
        checkin_date = date.today().isoformat()
        return self.query.exists({'user_id': user_id, 'market_id': market_id, 'checkin_date': checkin_date})

    def get_user_checkin_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def get_market_checkin_count(self, market_id: int) -> int:
        return self.query.count({'market_id': market_id})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
