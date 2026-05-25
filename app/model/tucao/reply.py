from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class ReplyModel:
    TABLE_NAME = 'tb_tucao_replies'

    STATUS_NORMAL = 0
    STATUS_DELETED = 1

    MAX_LEVEL = 3

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
                post_id INTEGER NOT NULL,
                parent_id INTEGER DEFAULT 0,
                reply_to_id INTEGER DEFAULT 0,
                user_id INTEGER DEFAULT 0,
                anonymous_id TEXT NOT NULL,
                content TEXT NOT NULL,
                like_count INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                ip_address TEXT DEFAULT '',
                device_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    @staticmethod
    def _generate_anonymous_id() -> str:
        return f"匿{secrets.token_hex(4).upper()}"

    def create(self, post_id: int, content: str, parent_id: int = 0,
               reply_to_id: int = 0, user_id: int = 0,
               ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        anonymous_id = self._generate_anonymous_id()
        
        level = 1
        if parent_id > 0:
            parent = self.get_by_id(parent_id)
            if parent:
                level = min(parent.get('level', 1) + 1, self.MAX_LEVEL)

        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'parent_id': parent_id,
            'reply_to_id': reply_to_id,
            'user_id': user_id,
            'anonymous_id': anonymous_id,
            'content': content,
            'like_count': 0,
            'level': level,
            'status': self.STATUS_NORMAL,
            'ip_address': ip_address,
            'device_id': device_id,
            'created_at': now,
            'updated_at': now
        }
        reply_id = self.exec.insert(data)
        return {
            'id': reply_id,
            'anonymous_id': anonymous_id,
            'level': level
        }

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        conditions = {'post_id': post_id, 'status': self.STATUS_NORMAL, 'parent_id': 0}
        return self.query.paginate(page, page_size, conditions, order_by='created_at ASC')

    def get_by_parent(self, parent_id: int) -> List[Dict[str, Any]]:
        conditions = {'parent_id': parent_id, 'status': self.STATUS_NORMAL}
        return self.query.find_all(conditions, order_by='created_at ASC')

    def increment_like_count(self, reply_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, reply_id))
        return cursor.rowcount

    def update_status(self, reply_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(reply_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def soft_delete(self, reply_id: int) -> int:
        return self.update_status(reply_id, self.STATUS_DELETED)

    def get_count_by_post(self, post_id: int) -> int:
        return self.query.count({'post_id': post_id, 'status': self.STATUS_NORMAL})

    def to_dict(self, reply: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': reply.get('id'),
            'post_id': reply.get('post_id'),
            'parent_id': reply.get('parent_id'),
            'reply_to_id': reply.get('reply_to_id'),
            'user_id': reply.get('user_id'),
            'anonymous_id': reply.get('anonymous_id'),
            'content': reply.get('content'),
            'like_count': reply.get('like_count'),
            'level': reply.get('level'),
            'status': reply.get('status'),
            'created_at': reply.get('created_at'),
            'updated_at': reply.get('updated_at')
        }

    def to_public_dict(self, reply: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': reply.get('id'),
            'post_id': reply.get('post_id'),
            'parent_id': reply.get('parent_id'),
            'reply_to_id': reply.get('reply_to_id'),
            'anonymous_id': reply.get('anonymous_id'),
            'content': reply.get('content'),
            'like_count': reply.get('like_count'),
            'level': reply.get('level'),
            'created_at': reply.get('created_at')
        }
