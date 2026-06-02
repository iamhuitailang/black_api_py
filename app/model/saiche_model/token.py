from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class TokenModel:
    TABLE_NAME = 'tb_saiche_model_token'

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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expires ON {cls.TABLE_NAME}(expires_at)"
        db.execute(index_sql)

    def create_token(self, user_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
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

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None

        now = datetime.now().isoformat()
        sql = f"""
            SELECT t.*, u.phone, u.nickname, u.avatar, u.coins, u.level, u.exp, u.status
            FROM {self.TABLE_NAME} t
            LEFT JOIN tb_saiche_model_users u ON t.user_id = u.id
            WHERE t.token = ? AND t.expires_at > ? AND u.status = 0
        """
        result = self.db.fetch_one(sql, (token, now))

        if result:
            return {
                'id': result.get('user_id'),
                'phone': result.get('phone'),
                'nickname': result.get('nickname'),
                'avatar': result.get('avatar'),
                'coins': result.get('coins'),
                'level': result.get('level'),
                'exp': result.get('exp'),
                'status': result.get('status'),
                'token': result.get('token')
            }
        return None

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def cleanup_expired(self) -> int:
        now = datetime.now().isoformat()
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        return self.exec.execute_raw(sql, (now,))
