from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class KuaidiMessageModel:
    TABLE_NAME = 'tb_kuaidi_077_model_message'

    TYPE_PICKUP_REMINDER = 1
    TYPE_OVERDUE_REMINDER = 2
    TYPE_PROXY_REQUEST = 3
    TYPE_PROXY_ACCEPTED = 4
    TYPE_SYSTEM = 5

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
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                related_id INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                read_at TIMESTAMP,
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

    def create(self, user_id: int, msg_type: int, title: str, content: str = '', related_id: int = 0) -> int:
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

    def send_pickup_reminder(self, user_id: int, package_id: int, tracking_number: str) -> int:
        title = '快递到件提醒'
        content = f'您的快递{tracking_number}已到达驿站，请及时取件。'
        return self.create(user_id, self.TYPE_PICKUP_REMINDER, title, content, package_id)

    def send_overdue_reminder(self, user_id: int, package_id: int, tracking_number: str, days: int) -> int:
        title = '快递超时提醒'
        content = f'您的快递{tracking_number}已存放{days}天，请尽快取件，超时将被退回。'
        return self.create(user_id, self.TYPE_OVERDUE_REMINDER, title, content, package_id)

    def send_proxy_request(self, user_id: int, proxy_id: int, requester_name: str) -> int:
        title = '代取件请求'
        content = f'{requester_name}发起了一个代取件请求，您可以选择接单。'
        return self.create(user_id, self.TYPE_PROXY_REQUEST, title, content, proxy_id)

    def send_proxy_accepted(self, user_id: int, proxy_id: int, proxy_name: str) -> int:
        title = '代取件已接单'
        content = f'{proxy_name}已接受您的代取件请求。'
        return self.create(user_id, self.TYPE_PROXY_ACCEPTED, title, content, proxy_id)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_unread_count(self, user_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (user_id, self.STATUS_UNREAD))
        return result['count'] if result else 0

    def mark_as_read(self, message_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_READ,
            'read_at': now
        }
        return self.exec.update_by_id(message_id, data)

    def mark_all_as_read(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        sql = f"UPDATE {self.TABLE_NAME} SET status = ?, read_at = ? WHERE user_id = ? AND status = ?"
        cursor = self.db.execute(sql, (self.STATUS_READ, now, user_id, self.STATUS_UNREAD))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                status: int = None, msg_type: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if status is not None:
            conditions['status'] = status
        if msg_type is not None:
            conditions['type'] = msg_type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_type_text(self, msg_type: int) -> str:
        type_map = {
            self.TYPE_PICKUP_REMINDER: '取件提醒',
            self.TYPE_OVERDUE_REMINDER: '超时提醒',
            self.TYPE_PROXY_REQUEST: '代取请求',
            self.TYPE_PROXY_ACCEPTED: '代取已接单',
            self.TYPE_SYSTEM: '系统消息'
        }
        return type_map.get(msg_type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_UNREAD: '未读',
            self.STATUS_READ: '已读'
        }
        return status_map.get(status, '未知')

    def to_dict(self, message: Dict[str, Any]) -> Dict[str, Any]:
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
            'read_at': message.get('read_at'),
            'created_at': message.get('created_at')
        }
