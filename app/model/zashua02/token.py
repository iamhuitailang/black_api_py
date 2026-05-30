from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import secrets


class TokenModel:
    TABLE_NAME = "tb_zashua02_model_token"

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
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, duration_hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expires_at = datetime.fromtimestamp(datetime.now().timestamp() + duration_hours * 3600).isoformat()
        now = datetime.now().isoformat()
        self.exec.insert({
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
            "created_at": now
        })
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({"token": token})

    def verify_token(self, token: str) -> Optional[int]:
        token_data = self.get_by_token(token)
        if not token_data:
            return None
        expires_at = token_data.get("expires_at")
        if expires_at:
            try:
                exp_time = datetime.fromisoformat(expires_at)
                if datetime.now() > exp_time:
                    self.delete_by_token(token)
                    return None
            except:
                pass
        return token_data.get("user_id")

    def delete_by_token(self, token: str) -> int:
        return self.exec.delete({"token": token})

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete({"user_id": user_id})

    def clean_expired(self) -> int:
        now = datetime.now().isoformat()
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE expires_at < ?"
        return self.db.execute(sql, (now,)).rowcount
