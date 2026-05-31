from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MessageModel:
    TABLE_NAME = 'tb_jaoyou_077_model_messages'

    TYPE_SYSTEM = 1
    TYPE_HEART = 2
    TYPE_MATCH = 3
    TYPE_DATE = 4

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
                type INTEGER DEFAULT 1,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                related_id INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, msg_type: int, title: str, content: str, related_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': msg_type,
            'title': title,
            'content': content,
            'related_id': related_id,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_messages(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None, msg_type: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if msg_type is not None:
            conditions['type'] = msg_type

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def mark_as_read(self, record_id: int) -> int:
        data = {
            'status': self.STATUS_READ
        }
        return self.exec.update_by_id(record_id, data)

    def mark_all_as_read(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET status = ? WHERE user_id = ? AND status = ?"
        return self.db.execute(sql, (self.STATUS_READ, user_id, self.STATUS_UNREAD))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def get_type_text(self, msg_type: int) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统消息',
            self.TYPE_HEART: '心动提醒',
            self.TYPE_MATCH: '匹配通知',
            self.TYPE_DATE: '约会邀请'
        }
        return type_map.get(msg_type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, message: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': message.get('id'),
            'user_id': message.get('user_id'),
            'type': message.get('type'),
            'type_text': self.get_type_text(message.get('type')),
            'title': message.get('title'),
            'content': message.get('content'),
            'related_id': message.get('related_id'),
            'status': message.get('status'),
            'status_text': self.get_status_text(message.get('status')),
            'created_at': message.get('created_at')
        }

    def count_unread(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (user_id, self.STATUS_UNREAD))
        return result.get('total', 0) if result else 0
