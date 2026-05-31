from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_fuwu_077_model_notification'

    TYPE_ORDER = 'order'
    TYPE_SYSTEM = 'system'
    TYPE_REMINDER = 'reminder'

    STATUS_UNREAD = 0
    STATUS_READ = 1

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
                related_id INTEGER DEFAULT NULL,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP DEFAULT NULL
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, content: str = '', 
               notification_type: str = 'system', 
               related_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'content': content,
            'type': notification_type,
            'related_id': related_id,
            'status': self.STATUS_UNREAD,
            'created_at': now,
            'read_at': None
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, 
                       page_size: int = 10, status: int = None,
                       notification_type: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if notification_type:
            conditions['type'] = notification_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_UNREAD})

    def mark_as_read(self, notification_id: int, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ,
            'read_at': now
        }
        return self.exec.update(data, {'id': notification_id, 'user_id': user_id})

    def mark_all_as_read(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ,
            'read_at': now
        }
        return self.exec.update(data, {'user_id': user_id, 'status': self.STATUS_UNREAD})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int, status: int = None) -> int:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.exec.delete(conditions)

    def get_all(self, page: int = 1, page_size: int = 10, 
                user_id: int = None, status: int = None,
                notification_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if status is not None:
            conditions['status'] = status
        if notification_type:
            conditions['type'] = notification_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读'
        }
        return status_map.get(status, '未知')

    def get_type_text(self, notification_type: str) -> str:
        type_map = {
            self.TYPE_ORDER: '订单通知',
            self.TYPE_SYSTEM: '系统通知',
            self.TYPE_REMINDER: '服务提醒'
        }
        return type_map.get(notification_type, '未知')

    def to_dict(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': notification.get('id'),
            'user_id': notification.get('user_id'),
            'title': notification.get('title'),
            'content': notification.get('content'),
            'type': notification.get('type'),
            'type_text': self.get_type_text(notification.get('type')),
            'related_id': notification.get('related_id'),
            'status': notification.get('status'),
            'status_text': self.get_status_text(notification.get('status')),
            'created_at': notification.get('created_at'),
            'read_at': notification.get('read_at')
        }
