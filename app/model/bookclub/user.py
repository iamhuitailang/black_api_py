from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserModel:
    TABLE_NAME = 'bc_users'

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
                nickname TEXT NOT NULL UNIQUE,
                avatar_url TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_nickname ON {cls.TABLE_NAME}(nickname)"
        db.execute(index_sql)

    def create(self, nickname: str, avatar_url: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'nickname': nickname,
            'avatar_url': avatar_url,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(user_id)

    def get_by_nickname(self, nickname: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('nickname', nickname)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def update(self, user_id: int, nickname: str = None, avatar_url: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if nickname is not None:
            data['nickname'] = nickname
        if avatar_url is not None:
            data['avatar_url'] = avatar_url
        return self.exec.update_by_id(user_id, data)

    def count(self) -> int:
        return self.query.count()
