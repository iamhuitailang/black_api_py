from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_order_users'

    STATUS_ACTIVE = 1
    STATUS_DISABLED = 0

    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'

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
                password TEXT NOT NULL,
                real_name TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                role TEXT DEFAULT 'user',
                avatar_url TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        model = cls()
        admin = model.get_by_username('admin')
        if not admin:
            model.create(
                username='admin',
                password='admin123654',
                real_name='管理员',
                role=cls.ROLE_ADMIN
            )
            print("  - Created default admin user: admin/admin123654")

    @staticmethod
    def _hash_password(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def create(self, username: str, password: str, real_name: str = '', phone: str = '',
               email: str = '', role: str = ROLE_USER, avatar_url: str = '') -> int:
        password_hash = self._hash_password(password)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password': password_hash,
            'real_name': real_name,
            'phone': phone,
            'email': email,
            'role': role,
            'avatar_url': avatar_url,
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
        user = self.get_by_username(username)
        if not user:
            return None

        password_hash = self._hash_password(password)

        if password_hash == user.get('password'):
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'real_name': user.get('real_name'),
                'phone': user.get('phone'),
                'email': user.get('email'),
                'role': user.get('role'),
                'avatar_url': user.get('avatar_url'),
                'status': user.get('status')
            }
        return None

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'real_name', 'phone', 'email', 'avatar_url', 'status', 'role'
        ]}
        if 'password' in data and data['password']:
            update_data['password'] = self._hash_password(data['password'])
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

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

        where_clauses.append("(username LIKE ? OR real_name LIKE ? OR phone LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

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
            'real_name': user.get('real_name'),
            'phone': user.get('phone'),
            'email': user.get('email'),
            'role': user.get('role'),
            'avatar_url': user.get('avatar_url'),
            'status': user.get('status'),
            'created_at': user.get('created_at')
        }