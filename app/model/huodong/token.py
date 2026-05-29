from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class HuodongTokenModel:
    TABLE_NAME = 'tb_huodong_model_tokens'

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

    def create_token(self, user_id: int, hours: int = 24) -> str:
        self.delete_by_user_id(user_id)
        token = secrets.token_hex(32)
        now = datetime.now()
        expires_at = now.replace(hour=now.hour + hours).isoformat() if now.hour + hours < 24 else now.replace(day=now.day + 1, hour=(now.hour + hours) % 24).isoformat()
        from datetime import timedelta
        expires_at = (now + timedelta(hours=hours)).isoformat()
        data = {
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': now.isoformat()
        }
        self.exec.insert(data)
        return token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        from app.model.huodong.user import HuodongUserModel
        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None
        now = datetime.now().isoformat()
        if token_record.get('expires_at', '') < now:
            self.delete_token(token)
            return None
        user_model = HuodongUserModel()
        user = user_model.get_by_id(token_record.get('user_id'))
        if not user:
            return None
        if user.get('status') == HuodongUserModel.STATUS_BANNED:
            return None
        return user_model.to_public_dict(user)

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})
