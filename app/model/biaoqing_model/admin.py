from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class AdminModel:
    TABLE_NAME = 'tb_biaoqing_model_admins'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    ROLE_SUPER_ADMIN = 0
    ROLE_ADMIN = 1
    ROLE_EDITOR = 2

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
                avatar TEXT DEFAULT '',
                role INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                last_login_at TIMESTAMP,
                last_login_ip TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        model = cls()
        existing = model.get_by_username('admin')
        if not existing:
            model.create('admin', 'admin123456', '超级管理员', role=model.ROLE_SUPER_ADMIN)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '',
               avatar: str = '', role: int = 1) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'avatar': avatar,
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

    def verify_password(self, username: str, password: str, ip: str = '') -> Optional[Dict[str, Any]]:
        admin = self.get_by_username(username)
        if not admin:
            return None

        if admin.get('status') != self.STATUS_ACTIVE:
            return None

        salt = admin.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == admin.get('password_hash'):
            now = datetime.now().isoformat()
            self.exec.update_by_id(admin['id'], {
                'last_login_at': now,
                'last_login_ip': ip
            })
            return {
                'id': admin.get('id'),
                'username': admin.get('username'),
                'nickname': admin.get('nickname'),
                'avatar': admin.get('avatar'),
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

    def update_profile(self, admin_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['nickname', 'avatar']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(admin_id, update_data)

    def update_status(self, admin_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(admin_id, {'status': status, 'updated_at': now})

    def update_role(self, admin_id: int, role: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(admin_id, {'role': role, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20, status: int = None,
                role: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if role is not None:
            conditions['role'] = role

        if keyword:
            return self.search(keyword, page, page_size, status, role)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 20,
               status: int = None, role: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if role is not None:
            where_clauses.append("role = ?")
            params.append(role)

        where_clauses.append("(username LIKE ? OR nickname LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def get_role_text(self, role: int) -> str:
        role_map = {
            self.ROLE_SUPER_ADMIN: '超级管理员',
            self.ROLE_ADMIN: '管理员',
            self.ROLE_EDITOR: '编辑'
        }
        return role_map.get(role, '未知')

    def to_dict(self, admin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': admin.get('id'),
            'username': admin.get('username'),
            'nickname': admin.get('nickname'),
            'avatar': admin.get('avatar'),
            'role': admin.get('role'),
            'role_text': self.get_role_text(admin.get('role')),
            'status': admin.get('status'),
            'status_text': self.get_status_text(admin.get('status')),
            'last_login_at': admin.get('last_login_at'),
            'last_login_ip': admin.get('last_login_ip'),
            'created_at': admin.get('created_at')
        }
