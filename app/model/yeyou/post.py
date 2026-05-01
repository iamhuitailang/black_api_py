from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class PostModel:
    TABLE_NAME = 'tb_yeyou_posts'

    STATUS_ACTIVE = 0
    STATUS_HIDDEN = 1

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
                images TEXT DEFAULT '[]',
                activity_id INTEGER,
                like_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, content: str = '', images: List[str] = None,
               activity_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'content': content or '',
            'images': json.dumps(images or [], ensure_ascii=False),
            'activity_id': activity_id,
            'like_count': 0,
            'comment_count': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, content: str = None, images: List[str] = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if content is not None:
            data['content'] = content
        if images is not None:
            data['images'] = json.dumps(images, ensure_ascii=False)
        return self.exec.update_by_id(record_id, data)

    def update_like_count(self, record_id: int, delta: int) -> int:
        post = self.get_by_id(record_id)
        if not post:
            return 0

        current = post.get('like_count', 0) or 0
        new_count = max(0, current + delta)
        return self.exec.update_by_id(record_id, {'like_count': new_count})

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, activity_id: int = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_ACTIVE}
        if user_id:
            conditions['user_id'] = user_id
        if activity_id:
            conditions['activity_id'] = activity_id

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["status = ?"]
        params = [self.STATUS_ACTIVE]

        where_clauses.append("content LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY created_at DESC 
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

    def to_public_dict(self, post: Dict[str, Any]) -> Dict[str, Any]:
        images_str = post.get('images', '[]')
        try:
            images = json.loads(images_str) if images_str else []
        except (json.JSONDecodeError, TypeError):
            images = []

        return {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'content': post.get('content'),
            'images': images,
            'activity_id': post.get('activity_id'),
            'like_count': post.get('like_count'),
            'comment_count': post.get('comment_count'),
            'status': post.get('status'),
            'created_at': post.get('created_at')
        }
