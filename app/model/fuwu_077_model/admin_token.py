from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class AdminTokenModel:
    TABLE_NAME = 'tb_fuwu_077_model_admin_token'

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
                admin_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_admin_id ON {cls.TABLE_NAME}(admin_id)"
        db.execute(index_sql)

    def create_token(self, admin_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        now = datetime.now().isoformat()
        data = {
            'admin_id': admin_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': now
        }
        self.exec.insert(data)
        return token

    def get_admin_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.fuwu_077_model.user import UserModel

        sql = f"""
            SELECT t.*, u.phone, u.nickname, u.avatar, u.role, u.status
            FROM {self.TABLE_NAME} t
            LEFT JOIN {UserModel.TABLE_NAME} u ON t.admin_id = u.id
            WHERE t.token = ? AND t.expires_at > ? AND u.role = 'admin'
        """
        now = datetime.now().isoformat()
        result = self.db.fetch_one(sql, (token, now))

        if result:
            return {
                'id': result.get('admin_id'),
                'phone': result.get('phone'),
                'nickname': result.get('nickname'),
                'avatar': result.get('avatar'),
                'role': result.get('role'),
                'status': result.get('status')
            }
        return None

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_admin_id(self, admin_id: int) -> int:
        return self.exec.delete({'admin_id': admin_id})
