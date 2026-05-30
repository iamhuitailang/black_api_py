from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_shiwu_model_notifications'

    TYPE_CLAIM = 'claim'
    TYPE_CLUE = 'clue'
    TYPE_COMMENT = 'comment'
    TYPE_LIKE = 'like'
    TYPE_SYSTEM = 'system'
    TYPE_REVIEW = 'review'

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
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                related_id INTEGER DEFAULT 0,
                related_type TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_related ON {cls.TABLE_NAME}(related_id, related_type)"
        db.execute(index_sql)

    def create(self, user_id: int, notification_type: str, title: str, content: str = '',
               related_id: int = 0, related_type: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': notification_type,
            'title': title,
            'content': content,
            'related_id': related_id,
            'related_type': related_type,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None, notification_type: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if notification_type:
            conditions['type'] = notification_type
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_unread_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (user_id, self.STATUS_UNREAD))
        return result.get('count', 0) if result else 0

    def mark_as_read(self, notification_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ
        }
        return self.exec.update_by_id(notification_id, data)

    def mark_all_as_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET status = ? WHERE user_id = ? AND status = ?"
        cursor = self.db.execute(sql, (self.STATUS_READ, user_id, self.STATUS_UNREAD))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def get_type_text(self, notification_type: str) -> str:
        type_map = {
            self.TYPE_CLAIM: '认领申请',
            self.TYPE_CLUE: '线索消息',
            self.TYPE_COMMENT: '评论',
            self.TYPE_LIKE: '点赞',
            self.TYPE_SYSTEM: '系统通知',
            self.TYPE_REVIEW: '互评'
        }
        return type_map.get(notification_type, '通知')

    def get_type_icon(self, notification_type: str) -> str:
        type_map = {
            self.TYPE_CLAIM: '📝',
            self.TYPE_CLUE: '💡',
            self.TYPE_COMMENT: '💬',
            self.TYPE_LIKE: '❤️',
            self.TYPE_SYSTEM: '🔔',
            self.TYPE_REVIEW: '⭐'
        }
        return type_map.get(notification_type, '📢')

    def to_dict(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': notification.get('id'),
            'user_id': notification.get('user_id'),
            'type': notification.get('type'),
            'type_text': self.get_type_text(notification.get('type')),
            'type_icon': self.get_type_icon(notification.get('type')),
            'title': notification.get('title'),
            'content': notification.get('content'),
            'related_id': notification.get('related_id'),
            'related_type': notification.get('related_type'),
            'status': notification.get('status'),
            'is_read': notification.get('status') == self.STATUS_READ,
            'created_at': notification.get('created_at')
        }
