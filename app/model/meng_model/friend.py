from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FriendModel:
    TABLE_NAME = 'tb_meng_model_friends'

    STATUS_PENDING = 0
    STATUS_FRIEND = 1
    STATUS_REJECTED = 2

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
                friend_id INTEGER NOT NULL,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, friend_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_friend_id ON {cls.TABLE_NAME}(friend_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_friend ON {cls.TABLE_NAME}(user_id, friend_id)"
        db.execute(index_sql)

    def create(self, user_id: int, friend_id: int, status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'friend_id': friend_id,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_friends(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {
            'user_id': user_id,
            'status': self.STATUS_FRIEND
        }
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_pending_requests(self, friend_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {
            'friend_id': friend_id,
            'status': self.STATUS_PENDING
        }
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def is_friend(self, user_id: int, friend_id: int) -> bool:
        where_clauses = [
            "(user_id = ? AND friend_id = ? AND status = ?)",
            "OR (user_id = ? AND friend_id = ? AND status = ?)"
        ]
        params = [
            user_id, friend_id, self.STATUS_FRIEND,
            friend_id, user_id, self.STATUS_FRIEND
        ]
        sql = f"""
            SELECT COUNT(*) as count FROM {self.TABLE_NAME}
            WHERE {' '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params))
        return result and result.get('count', 0) > 0

    def to_dict(self, friend: Dict[str, Any]) -> Dict[str, Any]:
        if not friend:
            return {}
        return {
            'id': friend.get('id'),
            'user_id': friend.get('user_id'),
            'friend_id': friend.get('friend_id'),
            'status': friend.get('status'),
            'status_text': self.get_status_text(friend.get('status')),
            'created_at': friend.get('created_at'),
            'updated_at': friend.get('updated_at')
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_FRIEND: '已好友',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')
