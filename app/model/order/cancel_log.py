from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CancelLogModel:
    TABLE_NAME = 'tb_order_cancel_logs'

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
                order_id INTEGER NOT NULL,
                user_id INTEGER,
                cancel_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reason TEXT DEFAULT '',
                is_auto INTEGER DEFAULT 0
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, order_id: int, user_id: int = None, reason: str = '', is_auto: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'user_id': user_id,
            'cancel_time': now,
            'reason': reason,
            'is_auto': is_auto
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'order_id': order_id}, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')