from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogShareModel:
    TABLE_NAME = 'tb_blog_share'

    TYPE_POST = 'post'
    TYPE_CATEGORY = 'category'
    TYPE_TAG = 'tag'
    TYPE_PROFILE = 'profile'

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
                share_type TEXT NOT NULL,
                target_id INTEGER,
                share_code TEXT NOT NULL UNIQUE,
                share_url TEXT,
                view_count INTEGER DEFAULT 0,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_share_code ON {cls.TABLE_NAME}(share_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(share_type, target_id)"
        db.execute(index_sql)

    def create_share(self, share_type: str, target_id: int = None, created_by: int = None, expires_at: str = None) -> Dict[str, Any]:
        import secrets
        share_code = secrets.token_urlsafe(8)
        now = datetime.now().isoformat()
        data = {
            'share_type': share_type,
            'target_id': target_id,
            'share_code': share_code,
            'share_url': f'/share/{share_code}',
            'view_count': 0,
            'created_by': created_by,
            'created_at': now,
            'expires_at': expires_at
        }
        self.exec.insert(data)
        return {
            'share_code': share_code,
            'share_url': f'/share/{share_code}',
            'target_type': share_type,
            'target_id': target_id,
            'created_at': now
        }

    def get_by_code(self, share_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'share_code': share_code})

    def increment_view_count(self, share_code: str) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE share_code = ?"
        cursor = self.db.execute(sql, (share_code,))
        return cursor.rowcount

    def get_share_info(self, share_code: str) -> Optional[Dict[str, Any]]:
        share = self.get_by_code(share_code)
        if not share:
            return None
        if share.get('expires_at') and share.get('expires_at') < datetime.now().isoformat():
            return None

        self.increment_view_count(share_code)

        result = {
            'share_type': share.get('share_type'),
            'target_id': share.get('target_id'),
            'share_code': share.get('share_code'),
            'share_url': share.get('share_url'),
            'view_count': share.get('view_count') or 0,
            'created_by': share.get('created_by'),
            'created_at': share.get('created_at')
        }

        if share.get('share_type') == self.TYPE_POST:
            from app.model.blog.post import BlogPostModel
            post_model = BlogPostModel()
            post = post_model.get_by_id(share.get('target_id'))
            if post:
                result['target'] = post_model.to_dict(post)

        elif share.get('share_type') == self.TYPE_CATEGORY:
            from app.model.blog.category import BlogCategoryModel
            cat_model = BlogCategoryModel()
            cat = cat_model.get_by_id(share.get('target_id'))
            if cat:
                result['target'] = cat_model.to_dict(cat, with_count=True)

        elif share.get('share_type') == self.TYPE_TAG:
            from app.model.blog.tag import BlogTagModel
            tag_model = BlogTagModel()
            tag = tag_model.get_by_id(share.get('target_id'))
            if tag:
                result['target'] = tag_model.to_dict(tag, with_count=True)

        elif share.get('share_type') == self.TYPE_PROFILE:
            from app.model.blog.user import BlogUserModel
            user_model = BlogUserModel()
            user = user_model.get_by_id(share.get('target_id'))
            if user:
                result['target'] = user_model.to_dict(user)

        return result
