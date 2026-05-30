from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LikeModel:
    TABLE_NAME = 'tb_shiwu_model_likes'

    TYPE_POST = 'post'
    TYPE_COMMENT = 'comment'

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
                target_id INTEGER NOT NULL,
                target_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_id, target_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(user_id, target_id, target_type)"
        db.execute(index_sql)

    def create(self, user_id: int, target_id: int, target_type: str) -> int:
        existing = self.get_by_user_and_target(user_id, target_id, target_type)
        if existing:
            return 0
        
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'target_id': target_id,
            'target_type': target_type,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_target(self, user_id: int, target_id: int, target_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'target_id': target_id,
            'target_type': target_type
        })

    def get_by_target(self, target_id: int, target_type: str, 
                      page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'target_id': target_id, 'target_type': target_type}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_user(self, user_id: int, target_type: str = None,
                    page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if target_type:
            conditions['target_type'] = target_type
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def delete(self, user_id: int, target_id: int, target_type: str) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ? AND target_id = ? AND target_type = ?"
        cursor = self.db.execute(sql, (user_id, target_id, target_type))
        return cursor.rowcount

    def get_count(self, target_id: int, target_type: str) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE target_id = ? AND target_type = ?"
        result = self.db.fetch_one(sql, (target_id, target_type))
        return result.get('count', 0) if result else 0

    def has_liked(self, user_id: int, target_id: int, target_type: str) -> bool:
        return self.get_by_user_and_target(user_id, target_id, target_type) is not None
