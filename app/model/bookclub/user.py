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
                nickname TEXT NOT NULL,
                avatar_url TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        old_cols = db.fetch_one(f"PRAGMA table_info({cls.TABLE_NAME})")
        has_unique = False
        rows = db.fetch_all(f"PRAGMA index_list({cls.TABLE_NAME})")
        for r in rows or []:
            if 'unique' in r and r['unique'] == 1:
                idx_name = r.get('name', '')
                if 'nickname' in idx_name.lower():
                    has_unique = True
                    break
        if has_unique:
            try:
                db.execute(f"DROP TABLE IF EXISTS {cls.TABLE_NAME}_backup")
                db.execute(f"CREATE TABLE {cls.TABLE_NAME}_backup AS SELECT * FROM {cls.TABLE_NAME}")
                db.execute(f"DROP TABLE {cls.TABLE_NAME}")
                db.execute(sql)
                db.execute(f"INSERT INTO {cls.TABLE_NAME} (id, nickname, avatar_url, created_at, updated_at) SELECT id, nickname, COALESCE(avatar_url, ''), created_at, updated_at FROM {cls.TABLE_NAME}_backup")
                db.execute(f"DROP TABLE {cls.TABLE_NAME}_backup")
            except Exception:
                pass

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
