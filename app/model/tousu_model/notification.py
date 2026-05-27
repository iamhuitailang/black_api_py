from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_tousu_model_notifications'

    TYPE_SYSTEM = 'system'
    TYPE_COMPLAINT = 'complaint'
    TYPE_FEEDBACK = 'feedback'
    TYPE_ANNOUNCEMENT = 'announcement'

    IS_READ_YES = 1
    IS_READ_NO = 0

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
                type TEXT NOT NULL DEFAULT 'system',
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                related_id INTEGER DEFAULT 0,
                is_read INTEGER DEFAULT 0,
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

    def create(self, user_id: int, notification_type: str, title: str, 
               content: str = '', related_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': notification_type,
            'title': title,
            'content': content,
            'related_id': related_id,
            'is_read': self.IS_READ_NO,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    is_read: int = None, notification_type: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if is_read is not None:
            conditions['is_read'] = is_read
        if notification_type:
            conditions['type'] = notification_type
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def mark_as_read(self, notification_id: int) -> int:
        return self.exec.update_by_id(notification_id, {'is_read': self.IS_READ_YES})

    def mark_all_as_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = ? WHERE user_id = ? AND is_read = ?"
        cursor = self.db.execute(sql, (self.IS_READ_YES, user_id, self.IS_READ_NO))
        return cursor.rowcount

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': self.IS_READ_NO})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_type_text(self, notification_type: str) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统通知',
            self.TYPE_COMPLAINT: '投诉通知',
            self.TYPE_FEEDBACK: '反馈通知',
            self.TYPE_ANNOUNCEMENT: '公告通知'
        }
        return type_map.get(notification_type, '未知')

    def to_dict(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': notification.get('id'),
            'user_id': notification.get('user_id'),
            'type': notification.get('type'),
            'type_text': self.get_type_text(notification.get('type')),
            'title': notification.get('title'),
            'content': notification.get('content'),
            'related_id': notification.get('related_id'),
            'is_read': notification.get('is_read'),
            'created_at': notification.get('created_at')
        }