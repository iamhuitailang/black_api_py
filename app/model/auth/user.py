from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets
import bcrypt


class UserModel:
    TABLE_NAME = 'tb_auth_user'
    
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
                role TEXT DEFAULT 'user',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

        cls._migrate_role_column()
        cls._seed_default_users()

    @classmethod
    def _migrate_role_column(cls):
        db = get_db()
        columns_info = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        has_role = False
        for col in columns_info:
            if col.get('name') == 'role':
                has_role = True
                break
        if not has_role:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN role TEXT DEFAULT 'user'")
            db.execute(f"UPDATE {cls.TABLE_NAME} SET role = 'admin' WHERE username = 'admin'")

    @classmethod
    def _seed_default_users(cls):
        db = get_db()
        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            password = 'admin123'
            password_hash = cls._hash_password_bcrypt(password)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ('admin', password_hash, '', 'admin', 1, now, now)
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    @staticmethod
    def _hash_password_bcrypt(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def _verify_password_bcrypt(password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except (ValueError, TypeError):
            return False

    def create(self, username: str, password: str, role: str = 'user') -> int:
        password_hash = self._hash_password_bcrypt(password)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': '',
            'role': role,
            'status': 1,
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

        password_hash = user.get('password_hash', '')
        salt = user.get('salt', '')

        is_valid = False
        if salt:
            old_hash = self._hash_password(password, salt)
            if old_hash == password_hash:
                is_valid = True
                self._upgrade_to_bcrypt(user.get('id'), password)
        else:
            if self._verify_password_bcrypt(password, password_hash):
                is_valid = True

        if is_valid:
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'role': user.get('role', 'user'),
                'status': user.get('status')
            }
        return None

    def _upgrade_to_bcrypt(self, user_id: int, password: str) -> None:
        password_hash = self._hash_password_bcrypt(password)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'salt': '',
            'updated_at': now
        }
        self.exec.update_by_id(user_id, data)

    def update_password(self, user_id: int, new_password: str) -> int:
        password_hash = self._hash_password_bcrypt(new_password)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'salt': '',
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def get_role(self, user_id: int) -> str:
        user = self.get_by_id(user_id)
        if not user:
            return 'user'
        return user.get('role', 'user')

    def is_admin(self, user_id: int) -> bool:
        return self.get_role(user_id) == 'admin'

    def update_status(self, user_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')
