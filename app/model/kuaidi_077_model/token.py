from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class KuaidiTokenModel:
    TABLE_NAME = 'tb_kuaidi_077_model_token'

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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expires_at ON {cls.TABLE_NAME}(expires_at)"
        db.execute(index_sql)

    def create_token(self, user_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        data = {
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': datetime.now().isoformat()
        }
        self.exec.insert(data)
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'token': token})

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.kuaidi_077_model.user import KuaidiUserModel

        token_data = self.get_by_token(token)
        if not token_data:
            return None

        expires_at = token_data.get('expires_at')
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
            self.delete_token(token)
            return None

        user_model = KuaidiUserModel()
        user = user_model.get_by_id(token_data.get('user_id'))
        if not user or user.get('status') == user_model.STATUS_BANNED:
            return None

        return user_model.to_public_dict(user)

    def delete_token(self, token: str) -> int:
        token_data = self.get_by_token(token)
        if not token_data:
            return 0
        return self.exec.delete_by_id(token_data.get('id'))

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount

    def cleanup_expired(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        cursor = self.db.execute(sql, (datetime.now().isoformat(),))
        return cursor.rowcount
