from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class BlogTokenModel:
    TABLE_NAME = 'tb_blog_token'

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
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expires_at ON {cls.TABLE_NAME}(expires_at)"
        db.execute(index_sql)

    def create_token(self, user_id: int, hours: int = 24 * 7) -> str:
        token = secrets.token_hex(32)
        now = datetime.now()
        expires_at = (now + timedelta(hours=hours)).isoformat()
        self.exec.insert({
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': now.isoformat()
        })
        return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.blog.user import BlogUserModel
        if not token:
            return None
        sql = f"""
            SELECT t.* FROM {self.TABLE_NAME} t
            WHERE t.token = ? AND t.expires_at > ?
            LIMIT 1
        """
        row = self.db.fetch_one(sql, (token, datetime.now().isoformat()))
        if not row:
            return None
        user_model = BlogUserModel()
        user = user_model.get_by_id(row.get('user_id'))
        if not user:
            return None
        return user_model.to_dict(user)

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def cleanup_expired(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        cursor = self.db.execute(sql, (datetime.now().isoformat(),))
        return cursor.rowcount
