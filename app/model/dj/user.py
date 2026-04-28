from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_dj_user'

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
                phone TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                nickname TEXT,
                avatar TEXT,
                status INTEGER DEFAULT 1,
                is_vendor INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)

        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE phone = '13800138000'")
        if not admin_exists:
            salt = secrets.token_hex(8)
            password = 'admin123'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (phone, password_hash, salt, nickname, status, is_vendor, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ('13800138000', password_hash, salt, '管理员', 1, 0, now, now)
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, phone: str, password: str, nickname: str = None) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'用户{phone[-4:]}',
            'status': 1,
            'is_vendor': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def verify_password(self, phone: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_phone(phone)
        if not user:
            return None

        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == user.get('password_hash'):
            return {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'status': user.get('status'),
                'is_vendor': user.get('is_vendor')
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
        update_data = {**data, 'updated_at': now}
        return self.exec.update_by_id(user_id, update_data)

    def update_status(self, user_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def set_vendor(self, user_id: int, is_vendor: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_vendor': is_vendor,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
