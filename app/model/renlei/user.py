from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets
import json


class UserModel:
    TABLE_NAME = 'tb_renlei_model_user'
    
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
                email TEXT,
                nickname TEXT,
                avatar TEXT,
                current_character_id INTEGER DEFAULT 1,
                current_level_id INTEGER DEFAULT 1,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, email: str = None, nickname: str = None) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'email': email,
            'nickname': nickname or username,
            'current_character_id': 1,
            'current_level_id': 1,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None
        
        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)
        
        if password_hash == user.get('password_hash'):
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'email': user.get('email'),
                'avatar': user.get('avatar'),
                'current_character_id': user.get('current_character_id'),
                'current_level_id': user.get('current_level_id')
            }
        return None

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def set_current_character(self, user_id: int, character_id: int) -> int:
        return self.update(user_id, current_character_id=character_id)

    def set_current_level(self, user_id: int, level_id: int) -> int:
        return self.update(user_id, current_level_id=level_id)

    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        salt = user.get('salt', '')
        old_hash = self._hash_password(old_password, salt)
        if old_hash != user.get('password_hash'):
            return False
        
        new_salt = secrets.token_hex(8)
        new_hash = self._hash_password(new_password, new_salt)
        self.update(user_id, password_hash=new_hash, salt=new_salt)
        return True

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit, offset=skip)

    def count(self) -> int:
        return self.query.count()
