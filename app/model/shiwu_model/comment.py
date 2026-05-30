from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CommentModel:
    TABLE_NAME = 'tb_shiwu_model_comments'

    STATUS_NORMAL = 0
    STATUS_DELETED = 1

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
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                parent_id INTEGER DEFAULT 0,
                reply_to_user_id INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, post_id: int, user_id: int, content: str, 
               parent_id: int = 0, reply_to_user_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'post_id': post_id,
            'user_id': user_id,
            'content': content,
            'parent_id': parent_id,
            'reply_to_user_id': reply_to_user_id,
            'like_count': 0,
            'status': self.STATUS_NORMAL,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_post(self, post_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'post_id': post_id, 'status': self.STATUS_NORMAL, 'parent_id': 0}
        result = self.query.paginate(page, page_size, conditions, order_by='created_at DESC')
        
        items = result.get('items', [])
        for item in items:
            item['replies'] = self.get_replies(item.get('id', 0))
        
        return {
            'items': items,
            'total': result.get('total', 0),
            'page': page,
            'page_size': page_size,
            'total_pages': result.get('total_pages', 0)
        }

    def get_replies(self, parent_id: int) -> List[Dict[str, Any]]:
        conditions = {'parent_id': parent_id, 'status': self.STATUS_NORMAL}
        result = self.query.paginate(1, 50, conditions, order_by='created_at ASC')
        return result.get('items', [])

    def increment_like_count(self, comment_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, comment_id))
        return cursor.rowcount

    def update(self, comment_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['content']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(comment_id, update_data)

    def delete(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_DELETED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def hard_delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_count_by_post(self, post_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE post_id = ? AND status = ?"
        result = self.db.fetch_one(sql, (post_id, self.STATUS_NORMAL))
        return result.get('count', 0) if result else 0

    def to_dict(self, comment: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.shiwu_model.user import UserModel
        user_model = UserModel()
        
        user = user_model.get_by_id(comment.get('user_id', 0))
        reply_to_user = None
        if comment.get('reply_to_user_id', 0) > 0:
            reply_to_user = user_model.get_by_id(comment.get('reply_to_user_id', 0))
        
        return {
            'id': comment.get('id'),
            'post_id': comment.get('post_id'),
            'user_id': comment.get('user_id'),
            'user': user_model.to_simple_dict(user) if user else None,
            'content': comment.get('content'),
            'parent_id': comment.get('parent_id'),
            'reply_to_user_id': comment.get('reply_to_user_id'),
            'reply_to_user': user_model.to_simple_dict(reply_to_user) if reply_to_user else None,
            'like_count': comment.get('like_count'),
            'status': comment.get('status'),
            'created_at': comment.get('created_at'),
            'updated_at': comment.get('updated_at')
        }
