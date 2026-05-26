from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class TokenModel:
    TABLE_NAME = 'tb_movie_token'

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
                token TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'user',
                expire_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create_token(self, user_id: int, role: str = 'user', hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expire_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        now = datetime.now().isoformat()
        data = {
            'token': token,
            'user_id': user_id,
            'role': role,
            'expire_at': expire_at,
            'created_at': now
        }
        self.exec.insert(data)
        return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None

        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None

        expire_str = token_record.get('expire_at', '')
        if expire_str:
            expire_time = datetime.fromisoformat(expire_str)
            if datetime.now() > expire_time:
                self.delete_token(token)
                return None

        user_id = token_record.get('user_id')
        role = token_record.get('role', 'user')

        from app.model.movie.user import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(user_id)
        if not user:
            return None

        if user.get('status') == UserModel.STATUS_BANNED:
            return None

        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'email': user.get('email'),
            'phone': user.get('phone'),
            'role': role or user.get('role'),
            'avatar': user.get('avatar'),
            'status': user.get('status')
        }

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def cleanup_expired_tokens(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expire_at < ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now,))
        return cursor.rowcount