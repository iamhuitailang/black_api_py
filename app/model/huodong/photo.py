from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PhotoModel:
    TABLE_NAME = 'tb_huodong_model_photos'

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
                url TEXT NOT NULL,
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int, url: str, description: str = '',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'url': url,
            'description': description,
            'sort_order': sort_order,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_activity(self, activity_id: int) -> list:
        return self.query.find_all({'activity_id': activity_id}, order_by='sort_order ASC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_activity(self, activity_id: int) -> int:
        return self.exec.delete({'activity_id': activity_id})

    def to_dict(self, photo: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': photo.get('id'),
            'activity_id': photo.get('activity_id'),
            'user_id': photo.get('user_id'),
            'url': photo.get('url'),
            'description': photo.get('description'),
            'sort_order': photo.get('sort_order'),
            'created_at': photo.get('created_at')
        }
