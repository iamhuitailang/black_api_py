from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_bm_users'

    STATUS_ACTIVE = 1
    STATUS_DISABLED = 0

    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'
    ROLE_SUPER_ADMIN = 'super_admin'

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
                openid TEXT UNIQUE,
                phone TEXT UNIQUE,
                username TEXT UNIQUE,
                password TEXT,
                avatar TEXT DEFAULT '',
                nickname TEXT DEFAULT '',
                real_name TEXT DEFAULT '',
                email TEXT DEFAULT '',
                role TEXT DEFAULT 'user',
                status INTEGER DEFAULT 1,
                last_login_ip TEXT DEFAULT '',
                last_login_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        model = cls()
        existing = model.get_by_username('admin')
        if not existing:
            salt = secrets.token_hex(8)
            password_hash = hashlib.sha256(('admin123654' + salt).encode()).hexdigest()
            now = datetime.now().isoformat()
            data = {
                'username': 'admin',
                'password': password_hash + ':' + salt,
                'nickname': '系统管理员',
                'real_name': '管理员',
                'role': cls.ROLE_SUPER_ADMIN,
                'status': cls.STATUS_ACTIVE,
                'created_at': now,
                'updated_at': now
            }
            model.exec.insert(data)
            print("  - Created default admin user: admin/admin123654")

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def _verify_password(self, stored_password: str, input_password: str) -> bool:
        if ':' in stored_password:
            password_hash, salt = stored_password.split(':', 1)
            return self._hash_password(input_password, salt) == password_hash
        return False

    def create(self, username: str, password: str, nickname: str = '', real_name: str = '',
               phone: str = '', email: str = '', role: str = ROLE_USER) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password': password_hash + ':' + salt,
            'nickname': nickname or username,
            'real_name': real_name,
            'phone': phone,
            'email': email,
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

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def verify_admin_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None

        if user.get('role') not in [self.ROLE_ADMIN, self.ROLE_SUPER_ADMIN]:
            return None

        if user.get('status') != self.STATUS_ACTIVE:
            return None

        stored_password = user.get('password', '')
        if self._verify_password(stored_password, password):
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'real_name': user.get('real_name'),
                'role': user.get('role')
            }
        return None

    def verify_user_password(self, phone: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_phone(phone)
        if not user:
            return None

        if user.get('status') != self.STATUS_ACTIVE:
            return None

        stored_password = user.get('password', '')
        if self._verify_password(stored_password, password):
            return {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'real_name': user.get('real_name')
            }
        return None

    def update_password(self, user_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        now = datetime.now().isoformat()
        data = {
            'password': password_hash + ':' + salt,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'nickname', 'real_name', 'phone', 'email', 'avatar'
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

    def update_last_login(self, user_id: int, ip: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'last_login_ip': ip,
            'last_login_time': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                role: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if role:
            conditions['role'] = role

        if keyword:
            return self.search(keyword, page, page_size, status, role)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, role: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if role:
            where_clauses.append("role = ?")
            params.append(role)

        where_clauses.append("(username LIKE ? OR nickname LIKE ? OR phone LIKE ? OR real_name LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

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

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'real_name': user.get('real_name'),
            'phone': user.get('phone'),
            'email': user.get('email'),
            'avatar': user.get('avatar'),
            'role': user.get('role'),
            'status': user.get('status'),
            'created_at': user.get('created_at')
        }
