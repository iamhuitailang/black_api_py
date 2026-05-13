from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_bm_notifications'

    TYPE_REGISTRATION_SUCCESS = 'registration_success'
    TYPE_APPROVAL = 'approval'
    TYPE_CANCEL = 'cancel'
    TYPE_REMINDER = 'reminder'

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
                content TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                related_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql)

    def create(self, user_id: int, msg_type: str, title: str, content: str, related_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': msg_type,
            'title': title,
            'content': content,
            'is_read': 0,
            'related_id': related_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10, is_read: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if is_read is not None:
            conditions['is_read'] = is_read
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def mark_as_read(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'is_read': 1})

    def mark_all_as_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE user_id = ? AND is_read = 0"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def get_unread_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND is_read = 0"
        result = self.db.fetch_one(sql, (user_id,))
        return result['count'] if result else 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': notification.get('id'),
            'user_id': notification.get('user_id'),
            'type': notification.get('type'),
            'title': notification.get('title'),
            'content': notification.get('content'),
            'is_read': notification.get('is_read'),
            'related_id': notification.get('related_id'),
            'created_at': notification.get('created_at')
        }
