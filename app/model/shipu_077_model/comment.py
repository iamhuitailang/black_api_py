from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CommentModel:
    TABLE_NAME = 'tb_shipu_077_model_comments'

    STATUS_ACTIVE = 0
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
                user_id INTEGER NOT NULL,
                recipe_id INTEGER NOT NULL,
                parent_id INTEGER DEFAULT 0,
                content TEXT NOT NULL,
                like_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_recipe_id ON {cls.TABLE_NAME}(recipe_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, recipe_id: int, content: str, parent_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'recipe_id': recipe_id,
            'parent_id': parent_id,
            'content': content,
            'like_count': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        result = self.query.find_by_id(record_id)
        if result and result.get('status') == self.STATUS_ACTIVE:
            return result
        return None

    def increment_like_count(self, comment_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, comment_id))
        return cursor.rowcount

    def delete(self, comment_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_DELETED,
            'updated_at': now
        }
        return self.exec.update_by_id(comment_id, data)

    def get_by_recipe(self, recipe_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE recipe_id = ? AND status = 0 AND parent_id = 0"
        total_result = self.db.fetch_one(count_sql, (recipe_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT c.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} c
            LEFT JOIN tb_shipu_077_model_users u ON c.user_id = u.id
            WHERE c.recipe_id = ? AND c.status = 0 AND c.parent_id = 0
            ORDER BY c.created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (recipe_id,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_replies(self, parent_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT c.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} c
            LEFT JOIN tb_shipu_077_model_users u ON c.user_id = u.id
            WHERE c.parent_id = ? AND c.status = 0
            ORDER BY c.created_at ASC
        """
        return self.db.fetch_all(sql, (parent_id,))

    def get_comment_count(self, recipe_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE recipe_id = ? AND status = 0"
        result = self.db.fetch_one(sql, (recipe_id,))
        return result['count'] if result else 0

    def to_dict(self, comment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': comment.get('id'),
            'user_id': comment.get('user_id'),
            'recipe_id': comment.get('recipe_id'),
            'parent_id': comment.get('parent_id'),
            'content': comment.get('content'),
            'like_count': comment.get('like_count'),
            'nickname': comment.get('nickname'),
            'avatar': comment.get('avatar'),
            'created_at': comment.get('created_at')
        }
