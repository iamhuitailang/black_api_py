from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogCommentModel:
    TABLE_NAME = 'tb_blog_comment'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
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
                post_id INTEGER NOT NULL,
                user_id INTEGER,
                parent_id INTEGER,
                nickname TEXT,
                email TEXT,
                content TEXT NOT NULL,
                status INTEGER DEFAULT 1,
                like_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, post_id: int, content: str, user_id: int = None,
               parent_id: int = None, nickname: str = None, email: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'user_id': user_id,
            'parent_id': parent_id,
            'nickname': nickname,
            'email': email,
            'content': content.strip(),
            'status': self.STATUS_APPROVED,
            'like_count': 0,
            'created_at': now,
            'updated_at': now
        }
        comment_id = self.exec.insert(data)
        if comment_id > 0:
            from app.model.blog.post import BlogPostModel
            post_model = BlogPostModel()
            post_model.increment_comment_count(post_id, 1)
        return comment_id

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 100, status: int = 1) -> Dict[str, Any]:
        conditions = {'post_id': post_id, 'status': status}
        return self.query.paginate(page, page_size, conditions, order_by='created_at ASC')

    def get_replies(self, parent_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'parent_id': parent_id}, order_by='created_at ASC')

    def increment_like_count(self, comment_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = MAX(like_count + ?, 0) WHERE id = ?"
        cursor = self.db.execute(sql, (delta, comment_id))
        return cursor.rowcount

    def update_status(self, comment_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(comment_id, {'status': status, 'updated_at': now})

    def update(self, comment_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['content', 'nickname', 'email', 'status']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(comment_id, update_data)

    def delete(self, record_id: int) -> int:
        comment = self.get_by_id(record_id)
        if comment and comment.get('post_id'):
            from app.model.blog.post import BlogPostModel
            post_model = BlogPostModel()
            post_model.increment_comment_count(comment.get('post_id'), -1)
        return self.exec.delete_by_id(record_id)

    def to_dict(self, comment: Dict[str, Any], with_user: bool = True, with_replies: bool = False) -> Dict[str, Any]:
        data = {
            'id': comment.get('id'),
            'post_id': comment.get('post_id'),
            'user_id': comment.get('user_id'),
            'parent_id': comment.get('parent_id'),
            'nickname': comment.get('nickname'),
            'email': comment.get('email'),
            'content': comment.get('content'),
            'status': comment.get('status'),
            'like_count': comment.get('like_count') or 0,
            'created_at': comment.get('created_at'),
            'updated_at': comment.get('updated_at')
        }

        if with_user and comment.get('user_id'):
            from app.model.blog.user import BlogUserModel
            user_model = BlogUserModel()
            user = user_model.get_by_id(comment.get('user_id'))
            if user:
                data['user'] = user_model.to_dict(user)

        if with_replies:
            replies = self.get_replies(comment.get('id'))
            data['replies'] = [self.to_dict(r, with_user=True, with_replies=False) for r in replies]

        return data
