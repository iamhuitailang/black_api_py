from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_jianshen_077_model_notification'

    TYPE_COURSE_REMINDER = 0
    TYPE_BOOKING_CONFIRMED = 1
    TYPE_BOOKING_CANCELLED = 2
    TYPE_CHECKIN = 3
    TYPE_SYSTEM = 4

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
                type INTEGER DEFAULT 0,
                is_read INTEGER DEFAULT 0,
                related_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_read ON {cls.TABLE_NAME}(user_id, is_read)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, content: str = '',
               ntype: int = 0, related_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'content': content,
            'type': ntype,
            'is_read': 0,
            'related_id': related_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def mark_as_read(self, notification_id: int) -> int:
        data = {'is_read': 1}
        return self.exec.update_by_id(notification_id, data)

    def mark_all_as_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE user_id = ? AND is_read = 0"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': 0})

    def get_unread_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'is_read': 0}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_type_text(self, ntype: int) -> str:
        type_map = {
            self.TYPE_COURSE_REMINDER: '课程提醒',
            self.TYPE_BOOKING_CONFIRMED: '预约确认',
            self.TYPE_BOOKING_CANCELLED: '预约取消',
            self.TYPE_CHECKIN: '签到通知',
            self.TYPE_SYSTEM: '系统通知'
        }
        return type_map.get(ntype, '未知')

    def to_dict(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': notification.get('id'),
            'user_id': notification.get('user_id'),
            'title': notification.get('title'),
            'content': notification.get('content'),
            'type': notification.get('type'),
            'type_text': self.get_type_text(notification.get('type')),
            'is_read': notification.get('is_read'),
            'related_id': notification.get('related_id'),
            'created_at': notification.get('created_at')
        }
