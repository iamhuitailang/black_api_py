from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class AdminModel:
    TABLE_NAME = 'tb_jianli_admins'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    ROLE_SUPER = 'super'
    ROLE_NORMAL = 'normal'

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
                role TEXT DEFAULT 'normal',
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
        admin_model = cls()
        existing = admin_model.get_by_username('admin')
        if not existing:
            admin_model.create('admin', 'admin123', '超级管理员', cls.ROLE_SUPER)
            print("  - Created default admin: admin/admin123")

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '', role: str = ROLE_NORMAL) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'role': role,
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
            return {
                'id': admin.get('id'),
                'username': admin.get('username'),
                'nickname': admin.get('nickname'),
                'role': admin.get('role'),
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

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def get_role_text(self, role: str) -> str:
        role_map = {
            self.ROLE_SUPER: '超级管理员',
            self.ROLE_NORMAL: '普通管理员'
        }
        return role_map.get(role, '未知')

    def to_public_dict(self, admin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': admin.get('id'),
            'username': admin.get('username'),
            'nickname': admin.get('nickname'),
            'role': admin.get('role'),
            'role_text': self.get_role_text(admin.get('role')),
            'status': admin.get('status'),
            'status_text': self.get_status_text(admin.get('status')),
            'created_at': admin.get('created_at')
        }
