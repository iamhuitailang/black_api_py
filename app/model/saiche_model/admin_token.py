from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class AdminTokenModel:
    TABLE_NAME = 'tb_saiche_model_admin_token'

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

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_admin_id ON {cls.TABLE_NAME}(admin_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)

    def create_token(self, admin_id: int, hours: int = 12) -> str:
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
        if not token:
            return None

        now = datetime.now().isoformat()
        sql = f"""
            SELECT t.*, a.username
            FROM {self.TABLE_NAME} t
            LEFT JOIN tb_saiche_model_admin a ON t.admin_id = a.id
            WHERE t.token = ? AND t.expires_at > ?
        """
        result = self.db.fetch_one(sql, (token, now))

        if result:
            return {
                'id': result.get('admin_id'),
                'username': result.get('username'),
                'token': result.get('token')
            }
        return None

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_admin_id(self, admin_id: int) -> int:
        return self.exec.delete({'admin_id': admin_id})
