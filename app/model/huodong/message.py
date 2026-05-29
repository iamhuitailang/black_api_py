from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MessageModel:
    TABLE_NAME = 'tb_huodong_model_messages'

    TYPE_SYSTEM = 'system'
    TYPE_ACTIVITY = 'activity'
    TYPE_INTERACTION = 'interaction'

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
                title TEXT DEFAULT '',
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'system',
                is_read INTEGER DEFAULT 0,
                reference_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_read ON {cls.TABLE_NAME}(is_read)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_message_type ON {cls.TABLE_NAME}(message_type)"
        db.execute(index_sql)

    def create(self, user_id: int, content: str, title: str = '', message_type: str = 'system',
               reference_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'content': content,
            'message_type': message_type,
            'is_read': 0,
            'reference_id': reference_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 20,
                    message_type: str = None, is_read: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if message_type:
            conditions['message_type'] = message_type
        if is_read is not None:
            conditions['is_read'] = is_read
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def mark_as_read(self, message_id: int) -> int:
        data = {'is_read': 1}
        return self.exec.update_by_id(message_id, data)

    def mark_all_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_read = 1 WHERE user_id = ? AND is_read = 0"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def count_unread(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_read': 0})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, message: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': message.get('id'),
            'user_id': message.get('user_id'),
            'title': message.get('title'),
            'content': message.get('content'),
            'message_type': message.get('message_type'),
            'is_read': message.get('is_read'),
            'reference_id': message.get('reference_id'),
            'created_at': message.get('created_at')
        }
