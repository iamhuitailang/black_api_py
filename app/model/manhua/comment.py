from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CommentModel:
    TABLE_NAME = 'tb_manhua_comments'

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
                user_id INTEGER NOT NULL,
                comic_id INTEGER NOT NULL,
                chapter_id INTEGER,
                content TEXT NOT NULL,
                parent_id INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_comic_id ON {cls.TABLE_NAME}(comic_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, comic_id: int, content: str,
               chapter_id: int = None, parent_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'comic_id': comic_id,
            'chapter_id': chapter_id,
            'content': content,
            'parent_id': parent_id,
            'like_count': 0,
            'status': self.STATUS_NORMAL,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_comic_id(self, comic_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'comic_id': comic_id, 'status': self.STATUS_NORMAL, 'parent_id': 0}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_parent_id(self, parent_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'parent_id': parent_id, 'status': self.STATUS_NORMAL}
        return self.query.paginate(page, page_size, conditions, order_by='created_at ASC')

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'status': self.STATUS_NORMAL}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def increment_like(self, comment_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = like_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, comment_id))
        return cursor.rowcount

    def update(self, comment_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(comment_id, data)

    def delete(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_DELETED,
            'content': '该评论已删除',
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete_permanent(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)