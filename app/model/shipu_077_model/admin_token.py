from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class AdminTokenModel:
    TABLE_NAME = 'tb_shipu_077_model_admin_tokens'

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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expires_at ON {cls.TABLE_NAME}(expires_at)"
        db.execute(index_sql)

    def create_token(self, admin_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        data = {
            'admin_id': admin_id,
            'token': token,
            'expires_at': expires_at
        }
        self.exec.insert(data)
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'token': token})

    def get_admin_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.model.shipu_077_model.admin import AdminModel

        token_data = self.get_by_token(token)
        if not token_data:
            return None

        expires_at = token_data.get('expires_at')
        if expires_at:
            try:
                expire_time = datetime.fromisoformat(expires_at)
                if datetime.now() > expire_time:
                    self.delete_token(token)
                    return None
            except (ValueError, TypeError):
                return None

        admin_model = AdminModel()
        admin = admin_model.get_by_id(token_data.get('admin_id'))
        if admin:
            return admin_model.to_dict(admin)
        return None

    def delete_token(self, token: str) -> int:
        return self.exec.delete(conditions={'token': token})

    def delete_by_admin_id(self, admin_id: int) -> int:
        return self.exec.delete(conditions={'admin_id': admin_id})

    def cleanup_expired(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now,))
        return cursor.rowcount
