from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LikeModel:
    TABLE_NAME = 'tb_tucao_likes'

    TYPE_POST = 'post'
    TYPE_REPLY = 'reply'

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
                target_id INTEGER NOT NULL,
                target_type TEXT NOT NULL,
                user_id INTEGER DEFAULT 0,
                ip_address TEXT DEFAULT '',
                device_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_id, target_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_ip_address ON {cls.TABLE_NAME}(ip_address)"
        db.execute(index_sql)

    def create(self, target_id: int, target_type: str, user_id: int = 0,
               ip_address: str = '', device_id: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'target_id': target_id,
            'target_type': target_type,
            'user_id': user_id,
            'ip_address': ip_address,
            'device_id': device_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def check_liked(self, target_id: int, target_type: str, user_id: int = 0,
                    ip_address: str = '', device_id: str = '') -> bool:
        conditions = {
            'target_id': target_id,
            'target_type': target_type
        }

        if user_id > 0:
            conditions['user_id'] = user_id
        elif device_id:
            conditions['device_id'] = device_id
        elif ip_address:
            conditions['ip_address'] = ip_address
        else:
            return False

        return self.query.exists(conditions)

    def get_like_record(self, target_id: int, target_type: str, user_id: int = 0,
                        ip_address: str = '', device_id: str = '') -> Optional[Dict[str, Any]]:
        conditions = {
            'target_id': target_id,
            'target_type': target_type
        }

        if user_id > 0:
            conditions['user_id'] = user_id
        elif device_id:
            conditions['device_id'] = device_id
        elif ip_address:
            conditions['ip_address'] = ip_address
        else:
            return None

        return self.query.find_one(conditions)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_count(self, target_id: int, target_type: str) -> int:
        return self.query.count({'target_id': target_id, 'target_type': target_type})
