from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = "tb_zashua02_model_user"

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
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                nickname TEXT DEFAULT '',
                character_type TEXT DEFAULT 'clown',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = "", character_type: str = "clown") -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            "username": username,
            "password_hash": password_hash,
            "salt": salt,
            "nickname": nickname or username,
            "character_type": character_type,
            "created_at": now,
            "updated_at": now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({"username": username})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None
        salt = user.get("salt", "")
        password_hash = self._hash_password(password, salt)
        if password_hash == user.get("password_hash"):
            return {
                "id": user.get("id"),
                "username": user.get("username"),
                "nickname": user.get("nickname"),
                "character_type": user.get("character_type")
            }
        return None

    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        salt = user.get("salt", "")
        old_hash = self._hash_password(old_password, salt)
        if old_hash != user.get("password_hash"):
            return False
        new_salt = secrets.token_hex(8)
        new_hash = self._hash_password(new_password, new_salt)
        now = datetime.now().isoformat()
        self.exec.update_by_id(user_id, {"password_hash": new_hash, "salt": new_salt, "updated_at": now})
        return True

    def update_character(self, user_id: int, character_type: str) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(user_id, {"character_type": character_type, "updated_at": now})

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ["nickname", "character_type"]}
        update_data["updated_at"] = now
        return self.exec.update_by_id(user_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def list_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by="id DESC")
