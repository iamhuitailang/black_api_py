from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class PostModel:
    TABLE_NAME = 'tb_qx_posts'

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
                content TEXT DEFAULT '',
                images TEXT DEFAULT '',
                activity_id INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, content: str = '', images: List[str] = None,
               activity_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'content': content,
            'images': json.dumps(images) if images else '',
            'activity_id': activity_id,
            'like_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, post_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['content']}
        if 'images' in data:
            update_data['images'] = json.dumps(data['images']) if data['images'] else ''
        update_data['updated_at'] = now
        return self.exec.update_by_id(post_id, update_data)

    def increment_like(self, post_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (post_id,))
        return cursor.rowcount

    def decrement_like(self, post_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count - 1 WHERE id = ? AND like_count > 0"
        cursor = self.db.execute(sql, (post_id,))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, activity_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if activity_id:
            conditions['activity_id'] = activity_id

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_feed(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT p.*, u.nickname, u.avatar, u.level
            FROM {self.TABLE_NAME} p
            LEFT JOIN tb_qx_users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql)

        return {
            'items': [self.to_dict_with_user(item) for item in items],
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        images = post.get('images', '')
        if images:
            try:
                images = json.loads(images)
            except:
                images = []
        else:
            images = []

        return {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'content': post.get('content'),
            'images': images,
            'activity_id': post.get('activity_id'),
            'like_count': post.get('like_count'),
            'created_at': post.get('created_at'),
            'updated_at': post.get('updated_at')
        }

    def to_dict_with_user(self, post: Dict[str, Any]) -> Dict[str, Any]:
        result = self.to_dict(post)
        result['user'] = {
            'id': post.get('user_id'),
            'nickname': post.get('nickname'),
            'avatar': post.get('avatar'),
            'level': post.get('level')
        }
        return result
