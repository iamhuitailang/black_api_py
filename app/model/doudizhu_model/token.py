from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class DoudizhuTokenModel:
    TABLE_NAME = 'tb_doudizhu_model_tokens'

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

    def create_token(self, user_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
        now = datetime.now()
        expires_at = (now + timedelta(hours=hours))
        data = {
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at.isoformat(),
            'created_at': now.isoformat()
        }
        self.exec.insert(data)
        return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.doudizhu_model.user import UserModel
        token_data = self.query.find_one({
            'token': token
        })
        if not token_data:
            return None

        expires_at_str = token_data.get('expires_at')
        if expires_at_str:
            try:
                if '+' in expires_at_str or 'Z' in expires_at_str:
                    expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                else:
                    expires_at = datetime.fromisoformat(expires_at_str)
            except:
                expires_at = datetime.now()
            if datetime.now() > expires_at:
                self.exec.delete(record_id=token_data.get('id'))
                return None

        user_id = token_data.get('user_id')
        user_model = UserModel()
        user = user_model.get_by_id(user_id)
        if not user or user.get('status') == UserModel.STATUS_BANNED:
            return None

        return user_model.to_public_dict(user)

    def delete_token(self, token: str) -> int:
        token_data = self.query.find_one({'token': token})
        if token_data:
            return self.exec.delete(record_id=token_data.get('id'))
        return 0

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def delete_expired_tokens(self) -> int:
        now = datetime.now().isoformat()
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < '{now}'"
        )
