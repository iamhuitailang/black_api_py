from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class AdminModel:
    TABLE_NAME = 'tb_wangzhe_model_admin'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        db = get_db()
        sql = f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}"
        result = db.fetch_one(sql)
        if result and result['count'] == 0:
            salt = secrets.token_hex(8)
            password_hash = hashlib.sha256(('admin123' + salt).encode()).hexdigest()
            now = datetime.now().isoformat()
            insert_sql = f"""
                INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, nickname, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            db.execute(insert_sql, ('admin', password_hash, salt, '超级管理员', 0, now, now))

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'status': self.STATUS_ACTIVE,
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
            if admin.get('status') == self.STATUS_DISABLED:
                return None
            return {
                'id': admin.get('id'),
                'username': admin.get('username'),
                'nickname': admin.get('nickname'),
                'status': admin.get('status')
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

    def update_profile(self, admin_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['nickname']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(admin_id, update_data)

    def update_status(self, admin_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(admin_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def to_public_dict(self, admin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': admin.get('id'),
            'username': admin.get('username'),
            'nickname': admin.get('nickname'),
            'status': admin.get('status'),
            'created_at': admin.get('created_at')
        }
