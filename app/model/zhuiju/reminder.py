from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReminderModel:
    TABLE_NAME = 'tb_zhuiju_reminder'

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
                drama_id INTEGER DEFAULT 0,
                rtype TEXT DEFAULT 'update',
                message TEXT DEFAULT '',
                remind_at TEXT DEFAULT '',
                is_read INTEGER DEFAULT 0,
                extra TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        idx = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_drama ON {cls.TABLE_NAME}(drama_id)"
        db.execute(idx)
        idx2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(idx2)

    def create(self, drama_id: int = 0, rtype: str = 'update', message: str = '',
               remind_at: str = '', extra: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'drama_id': drama_id,
            'rtype': rtype,
            'message': message,
            'remind_at': remind_at,
            'is_read': 0,
            'extra': extra,
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, conditions: Dict[str, Any] = None, order_by: str = 'id DESC') -> List[Dict[str, Any]]:
        return self.query.find_all(conditions=conditions, order_by=order_by)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in data.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def count_unread(self) -> int:
        return self.query.count({'is_read': 0})

    def mark_all_read(self) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1, updated_at = ?"
        return self.db.execute(sql, (datetime.now().isoformat(),))
