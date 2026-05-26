from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class AdminTokenModel:
    TABLE_NAME = 'tb_jianli_admin_tokens'

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
        if not token:
            return None

        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None

        expires_at = token_record.get('expires_at')
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
            self.delete_token(token)
            return None

        from .admin import AdminModel
        admin_model = AdminModel()
        admin = admin_model.get_by_id(token_record.get('admin_id'))
        if not admin:
            return None

        if admin.get('status') == AdminModel.STATUS_DISABLED:
            return None

        return admin_model.to_public_dict(admin)

    def delete_token(self, token: str) -> int:
        return self.exec.delete({'token': token})

    def delete_by_admin_id(self, admin_id: int) -> int:
        return self.exec.delete({'admin_id': admin_id})
