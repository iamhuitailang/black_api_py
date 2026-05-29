from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class DianyingUserModel:
    TABLE_NAME = 'tb_dianying_model_user'

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
                email TEXT DEFAULT '',
                role TEXT DEFAULT 'user',
                avatar TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

        for uname, pwd, role in [('admin', 'admin123', 'admin'), ('user', 'user123', 'user')]:
            exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = ?", (uname,))
            if not exists:
                salt = secrets.token_hex(8)
                password_hash = cls._hash_password(pwd, salt)
                now = datetime.now().isoformat()
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, email, role, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (uname, password_hash, salt, f'{uname}@dianying.com', role, '', now, now)
                )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, email: str = '', role: str = 'user') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'email': email,
            'role': role,
            'avatar': '',
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
                'email': user.get('email', ''),
                'role': user.get('role', 'user'),
                'avatar': user.get('avatar', '')
            }
        return None

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
        now = datetime.now().isoformat()
        self.exec.update_by_id(user_id, {
            'password_hash': new_hash,
            'salt': new_salt,
            'updated_at': now
        })
        return True

    def update_profile(self, user_id: int, email: str = None, avatar: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if email is not None:
            data['email'] = email
        if avatar is not None:
            data['avatar'] = avatar
        return self.exec.update_by_id(user_id, data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
