from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CommentModel:
    TABLE_NAME = 'tb_huodong_model_comments'

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
                activity_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                parent_id INTEGER DEFAULT 0,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int, content: str, parent_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'parent_id': parent_id,
            'content': content,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_activity(self, activity_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'activity_id': activity_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at ASC')

    def get_replies(self, parent_id: int) -> list:
        return self.query.find_all({'parent_id': parent_id}, order_by='created_at ASC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_activity(self, activity_id: int) -> int:
        return self.query.count({'activity_id': activity_id})

    def to_dict(self, comment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': comment.get('id'),
            'activity_id': comment.get('activity_id'),
            'user_id': comment.get('user_id'),
            'parent_id': comment.get('parent_id'),
            'content': comment.get('content'),
            'created_at': comment.get('created_at'),
            'updated_at': comment.get('updated_at')
        }
