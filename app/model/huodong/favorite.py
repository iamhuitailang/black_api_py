from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FavoriteModel:
    TABLE_NAME = 'tb_huodong_model_favorites'

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
                activity_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)

    def add(self, user_id: int, activity_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'activity_id': activity_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def remove(self, user_id: int, activity_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'activity_id': activity_id})

    def is_favorited(self, user_id: int, activity_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'activity_id': activity_id})

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def count_by_user(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def count_by_activity(self, activity_id: int) -> int:
        return self.query.count({'activity_id': activity_id})
