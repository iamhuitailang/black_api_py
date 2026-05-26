from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class BlogUserModel:
    TABLE_NAME = 'tb_blog_user'

    STATUS_NORMAL = 1
    STATUS_BANNED = 0

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
                nickname TEXT,
                email TEXT,
                avatar TEXT,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                bio TEXT,
                site_url TEXT,
                github TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_email ON {cls.TABLE_NAME}(email)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            salt = secrets.token_hex(8)
            password = 'admin123'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, nickname, password_hash, salt, bio, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ('admin', '博主', password_hash, salt, '这是默认的管理员账号，密码为 admin123', 1, now, now)
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = None, email: str = None, avatar: str = None, bio: str = None) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username.strip(),
            'nickname': nickname or username,
            'email': email,
            'avatar': avatar,
            'password_hash': password_hash,
            'salt': salt,
            'bio': bio,
            'status': self.STATUS_NORMAL,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username.strip()})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None
        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)
        if password_hash == user.get('password_hash'):
            if user.get('status') != self.STATUS_NORMAL:
                return None
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'email': user.get('email'),
                'avatar': user.get('avatar'),
                'status': user.get('status')
            }
        return None

    def update_password(self, user_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'salt': salt,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'nickname', 'email', 'avatar', 'bio', 'site_url', 'github'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(user_id, update_data)

    def update_status(self, user_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def exists_by_username(self, username: str) -> bool:
        return self.query.exists({'username': username.strip()})

    def to_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname') or user.get('username'),
            'email': user.get('email'),
            'avatar': user.get('avatar'),
            'bio': user.get('bio'),
            'site_url': user.get('site_url'),
            'github': user.get('github'),
            'status': user.get('status'),
            'created_at': user.get('created_at'),
            'updated_at': user.get('updated_at')
        }
