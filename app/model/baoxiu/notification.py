from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_baoxiu_notification'

    TYPE_SYSTEM = 'system'
    TYPE_ORDER = 'order'
    TYPE_REPAIR = 'repair'

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
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                type TEXT DEFAULT 'system',
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql3)

    def create(self, user_id: int, title: str, content: str = '',
               type: str = 'system') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'content': content,
            'type': type,
            'is_read': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1,
                       page_size: int = 10, is_read: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if is_read is not None:
            conditions['is_read'] = is_read

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def mark_as_read(self, notification_id: int) -> int:
        return self.exec.update({'is_read': 1}, record_id=notification_id)

    def mark_all_as_read(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE user_id = ? AND is_read = 0",
            (user_id,)
        )

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': 0})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统通知',
            self.TYPE_ORDER: '报修通知',
            self.TYPE_REPAIR: '维修通知'
        }
        return type_map.get(type, '通知')
