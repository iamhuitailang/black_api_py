from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class TokenModel:
    TABLE_NAME = 'tb_manhua_tokens'

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
        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None

        expires_at = token_record.get('expires_at')
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
            self.exec.delete_by_id(token_record.get('id'))
            return None

        from app.model.manhua.user import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(token_record.get('user_id'))
        if not user:
            return None

        return user_model.to_public_dict(user)

    def delete_token(self, token: str) -> int:
        conditions = {'token': token}
        return self.exec.delete(conditions)

    def delete_by_user_id(self, user_id: int) -> int:
        conditions = {'user_id': user_id}
        return self.exec.delete(conditions)

    def cleanup_expired(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now,))
        return cursor.rowcount