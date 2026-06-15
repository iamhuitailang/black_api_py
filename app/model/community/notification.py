from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_community_notification'

    TYPE_OVERDUE = 'overdue'
    TYPE_REQUEST = 'request'
    TYPE_APPROVED = 'approved'
    TYPE_REJECTED = 'rejected'

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
                content TEXT,
                related_id INTEGER,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)")

    def create(self, user_id: int, notif_type: str, title: str,
               content: str = None, related_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': notif_type,
            'title': title,
            'content': content,
            'related_id': related_id,
            'is_read': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int, unread_only: bool = False,
                    limit: int = 50) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if unread_only:
            conditions['is_read'] = 0
        return self.query.find_all(conditions, order_by='id DESC', limit=limit)

    def count_unread(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': 0})

    def mark_read(self, notif_id: int, user_id: int) -> int:
        data = {'is_read': 1}
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE id = ? AND user_id = ?"
        return self.db.execute(sql, (notif_id, user_id))

    def mark_all_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE user_id = ? AND is_read = 0"
        return self.db.execute(sql, (user_id,))
