from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class AdminModel:
    TABLE_NAME = 'tb_jaoyou_077_model_admins'

    ROLE_ADMIN = 1
    ROLE_SUPER_ADMIN = 2

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
                role INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

        db.execute(f"""
            INSERT OR IGNORE INTO {cls.TABLE_NAME} (username, password_hash, salt, nickname, role)
            VALUES (?, ?, ?, ?, ?)
        """, ('admin', hashlib.sha256(('admin123' + 'jaoyou').encode()).hexdigest(), 'jaoyou', '超级管理员', 2))

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '', role: int = 1) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'role': role,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        admin = self.get_by_username(username)
        if not admin:
            return None

        salt = admin.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == admin.get('password_hash'):
            return {
                'id': admin.get('id'),
                'username': admin.get('username'),
                'nickname': admin.get('nickname'),
                'role': admin.get('role')
            }
        return None

    def update_password(self, admin_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'salt': salt,
            'updated_at': now
        }
        return self.exec.update_by_id(admin_id, data)

    def get_role_text(self, role: int) -> str:
        role_map = {
            self.ROLE_ADMIN: '管理员',
            self.ROLE_SUPER_ADMIN: '超级管理员'
        }
        return role_map.get(role, '未知')

    def to_public_dict(self, admin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': admin.get('id'),
            'username': admin.get('username'),
            'nickname': admin.get('nickname'),
            'role': admin.get('role'),
            'role_text': self.get_role_text(admin.get('role')),
            'created_at': admin.get('created_at')
        }
