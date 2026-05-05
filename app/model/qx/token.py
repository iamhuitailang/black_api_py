from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class QxTokenModel:
    TABLE_NAME = 'tb_qx_token'

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
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    @staticmethod
    def _generate_token() -> str:
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
        if not token:
            return None

        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None

        expires_at = token_record.get('expires_at')
        if expires_at:
            try:
                if isinstance(expires_at, str):
                    expires_dt = datetime.fromisoformat(expires_at)
                else:
                    expires_dt = expires_at

                if expires_dt < datetime.now():
                    self.exec.delete_by_id(token_record.get('id'))
                    return None
            except (ValueError, TypeError):
                pass

        return token_record

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        token_record = self.get_by_token(token)
        if not token_record:
            return None

        user_id = token_record.get('user_id')
        from app.model.qx.user import UserModel
        user_model = UserModel()
        user = user_model.get_by_id(user_id)

        if user:
            return {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'level': user.get('level'),
                'total_distance': user.get('total_distance'),
                'total_duration': user.get('total_duration'),
                'avg_speed': user.get('avg_speed'),
                'bike_type': user.get('bike_type'),
                'bio': user.get('bio'),
                'status': user.get('status')
            }
        return None

    def delete_token(self, token: str) -> int:
        token_record = self.query.find_one({'token': token})
        if token_record:
            return self.exec.delete_by_id(token_record.get('id'))
        return 0

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )
