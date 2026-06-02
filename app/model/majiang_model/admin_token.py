from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class MajiangAdminTokenModel:
    TABLE_NAME = 'tb_majiang_model_admin_token'

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
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_admin_id ON {cls.TABLE_NAME}(admin_id)"
        db.execute(index_sql2)

    @staticmethod
    def _generate_token() -> str:
        return secrets.token_hex(32)

    def create_token(self, admin_id: int, hours: int = 24) -> str:
        token = self._generate_token()
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

    def get_admin_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        token_record = self.get_by_token(token)
        if not token_record:
            return None

        admin_id = token_record.get('admin_id')
        from app.model.majiang_model.admin import AdminModel
        admin_model = AdminModel()
        admin = admin_model.get_by_id(admin_id)

        if admin:
            return admin_model.to_dict(admin)
        return None

    def delete_token(self, token: str) -> int:
        token_record = self.query.find_one({'token': token})
        if token_record:
            return self.exec.delete_by_id(token_record.get('id'))
        return 0

    def delete_by_admin_id(self, admin_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE admin_id = ?",
            (admin_id,)
        )
