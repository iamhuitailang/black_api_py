from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class PostModel:
    TABLE_NAME = 'tb_tucao_posts'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    STATUS_DELETED = 3

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
                user_id INTEGER DEFAULT 0,
                anonymous_id TEXT NOT NULL,
                category TEXT DEFAULT '',
                content TEXT NOT NULL,
                delete_code TEXT NOT NULL,
                like_count INTEGER DEFAULT 0,
                reply_count INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                ip_address TEXT DEFAULT '',
                device_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_delete_code ON {cls.TABLE_NAME}(delete_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_like_count ON {cls.TABLE_NAME}(like_count)"
        db.execute(index_sql)

    @staticmethod
    def _generate_anonymous_id() -> str:
        return f"匿{secrets.token_hex(4).upper()}"

    @staticmethod
    def _generate_delete_code() -> str:
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        code = ''.join(secrets.choice(chars) for _ in range(4))
        code += '-'
        code += ''.join(secrets.choice(chars) for _ in range(4))
        return code

    def create(self, content: str, category: str = '', user_id: int = 0,
               ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        anonymous_id = self._generate_anonymous_id()
        delete_code = self._generate_delete_code()
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'anonymous_id': anonymous_id,
            'category': category,
            'content': content,
            'delete_code': delete_code,
            'like_count': 0,
            'reply_count': 0,
            'view_count': 0,
            'status': self.STATUS_APPROVED,
            'ip_address': ip_address,
            'device_id': device_id,
            'created_at': now,
            'updated_at': now
        }
        post_id = self.exec.insert(data)
        return {
            'id': post_id,
            'anonymous_id': anonymous_id,
            'delete_code': delete_code
        }

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_delete_code(self, delete_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'delete_code': delete_code})

    def increment_view_count(self, post_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (post_id,))
        return cursor.rowcount

    def increment_like_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def increment_reply_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET reply_count = reply_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def update_status(self, post_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(post_id, data)

    def update_content(self, post_id: int, content: str, category: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'content': content,
            'updated_at': now
        }
        if category is not None:
            data['category'] = category
        return self.exec.update_by_id(post_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def soft_delete(self, post_id: int) -> int:
        return self.update_status(post_id, self.STATUS_DELETED)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'status': self.STATUS_APPROVED}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_delete_code_prefix(self, delete_code: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE delete_code LIKE ? AND status = ? ORDER BY created_at DESC"
        return self.db.fetch_all(sql, (f"{delete_code}%", self.STATUS_APPROVED))

    def get_list(self, page: int = 1, page_size: int = 10,
                 category: str = None, status: int = None,
                 keyword: str = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        else:
            conditions['status'] = self.STATUS_APPROVED

        if keyword:
            return self.search(keyword, page, page_size, category, status, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category: str = None, status: int = None,
               order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        else:
            where_clauses.append("status = ?")
            params.append(self.STATUS_APPROVED)

        where_clauses.append("content LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY {order_by}
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_hot_list(self, page: int = 1, page_size: int = 10,
                     category: str = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_APPROVED}
        if category:
            conditions['category'] = category
        return self.query.paginate(page, page_size, conditions, order_by='like_count DESC, created_at DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_DELETED: '已删除'
        }
        return status_map.get(status, '未知')

    def to_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'anonymous_id': post.get('anonymous_id'),
            'category': post.get('category'),
            'content': post.get('content'),
            'delete_code': post.get('delete_code'),
            'like_count': post.get('like_count'),
            'reply_count': post.get('reply_count'),
            'view_count': post.get('view_count'),
            'status': post.get('status'),
            'status_text': self.get_status_text(post.get('status')),
            'created_at': post.get('created_at'),
            'updated_at': post.get('updated_at')
        }

    def to_public_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': post.get('id'),
            'anonymous_id': post.get('anonymous_id'),
            'category': post.get('category'),
            'content': post.get('content'),
            'like_count': post.get('like_count'),
            'reply_count': post.get('reply_count'),
            'view_count': post.get('view_count'),
            'created_at': post.get('created_at')
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(sql)
        total = total_result['total'] if total_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        approved_result = self.db.fetch_one(sql, (self.STATUS_APPROVED,))
        approved = approved_result['count'] if approved_result else 0

        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        pending_result = self.db.fetch_one(sql, (self.STATUS_PENDING,))
        pending = pending_result['count'] if pending_result else 0

        today = datetime.now().strftime('%Y-%m-%d')
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE DATE(created_at) = ?"
        today_result = self.db.fetch_one(sql, (today,))
        today_count = today_result['count'] if today_result else 0

        return {
            'total': total,
            'approved': approved,
            'pending': pending,
            'today_count': today_count
        }
