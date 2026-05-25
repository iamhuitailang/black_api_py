from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NotificationModel:
    TABLE_NAME = 'tb_xiaozu_notifications'

    TYPE_TASK_ASSIGNED = 'task_assigned'
    TYPE_TASK_COMPLETED = 'task_completed'
    TYPE_TASK_COMMENTED = 'task_commented'
    TYPE_TEAM_INVITE = 'team_invite'
    TYPE_MENTIONED = 'mentioned'
    TYPE_SYSTEM = 'system'

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
                is_read INTEGER DEFAULT 0,
                related_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql2)

    def create(self, user_id: int, type: str, title: str, content: str = '',
               related_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': type,
            'title': title,
            'content': content or '',
            'is_read': 0,
            'related_id': related_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, is_read: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if is_read is not None:
            conditions['is_read'] = is_read
        return self.query.find_all(conditions, order_by='id DESC', limit=50)

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': 0})

    def mark_as_read(self, notification_id: int) -> int:
        return self.exec.update_by_id(notification_id, {'is_read': 1})

    def mark_all_as_read(self, user_id: int) -> int:
        return self.exec.update({'is_read': 1}, {'user_id': user_id, 'is_read': 0})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
