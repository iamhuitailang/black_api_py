from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class UserTokenModel:
    TABLE_NAME = 'tb_bm_user_tokens'

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

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def _generate_token(self) -> str:
        return secrets.token_hex(32)

    def create_token(self, user_id: int, hours: int = 24) -> str:
        token = self._generate_token()
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': now
        }
        self.exec.insert(data)
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'token': token})

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT u.* FROM {self.TABLE_NAME} t
            JOIN tb_bm_users u ON t.user_id = u.id
            WHERE t.token = ? AND t.expires_at > ?
        """
        now = datetime.now().isoformat()
        return self.db.fetch_one(sql, (token, now))

    def delete_token(self, token: str) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE token = ?"
        cursor = self.db.execute(sql, (token,))
        return cursor.rowcount

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def cleanup_expired(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at <= ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now,))
        return cursor.rowcount
