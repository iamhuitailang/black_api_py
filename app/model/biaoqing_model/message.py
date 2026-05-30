from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MessageModel:
    TABLE_NAME = 'tb_biaoqing_model_messages'

    TYPE_SYSTEM = 0
    TYPE_COMMENT = 1
    TYPE_LIKE = 2
    TYPE_FAVORITE = 3
    TYPE_FOLLOW = 4
    TYPE_ACTIVITY = 5

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
                from_user_id INTEGER DEFAULT 0,
                type INTEGER DEFAULT 0,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                extra_data TEXT DEFAULT '',
                emoji_id INTEGER DEFAULT 0,
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

    def create(self, user_id: int, type: int = 0, title: str = '', content: str = '',
               from_user_id: int = 0, emoji_id: int = 0, extra_data: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'from_user_id': from_user_id,
            'type': type,
            'title': title,
            'content': content,
            'extra_data': extra_data,
            'emoji_id': emoji_id,
            'status': self.STATUS_UNREAD,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def mark_as_read(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_READ})

    def mark_all_as_read(self, user_id: int) -> int:
        return self.exec.update(
            {'status': self.STATUS_READ},
            {'user_id': user_id, 'status': self.STATUS_UNREAD}
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20,
                       status: int = None, type: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        if type is not None:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_unread_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_UNREAD})

    def get_type_text(self, type: int) -> str:
        type_map = {
            self.TYPE_SYSTEM: '系统消息',
            self.TYPE_COMMENT: '评论消息',
            self.TYPE_LIKE: '点赞消息',
            self.TYPE_FAVORITE: '收藏消息',
            self.TYPE_FOLLOW: '关注消息',
            self.TYPE_ACTIVITY: '活动消息'
        }
        return type_map.get(type, '未知')

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
            'from_user_id': message.get('from_user_id'),
            'type': message.get('type'),
            'type_text': self.get_type_text(message.get('type')),
            'title': message.get('title'),
            'content': message.get('content'),
            'extra_data': message.get('extra_data'),
            'emoji_id': message.get('emoji_id'),
            'status': message.get('status'),
            'status_text': self.get_status_text(message.get('status')),
            'created_at': message.get('created_at')
        }
