from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


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
                role TEXT NOT NULL DEFAULT 'resident',
                real_name TEXT,
                phone TEXT,
                community TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql2)
        
        cols = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        col_names = [c.get('name') for c in cols]
        if 'role' not in col_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN role TEXT NOT NULL DEFAULT 'resident'")
        if 'real_name' not in col_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN real_name TEXT")
        if 'phone' not in col_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN phone TEXT")
        if 'community' not in col_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN community TEXT")
        
        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            salt = secrets.token_hex(8)
            password = 'admin123'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, real_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                ('admin', password_hash, salt, 'admin', '系统管理员', 1, now, now)
            )
        
        staff_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'staff1'")
        if not staff_exists:
            salt = secrets.token_hex(8)
            password = '123456'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, real_name, community, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('staff1', password_hash, salt, 'staff', '张社工', '阳光社区', 1, now, now)
            )
        
        staff2_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'staff2'")
        if not staff2_exists:
            salt = secrets.token_hex(8)
            password = '123456'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, real_name, community, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('staff2', password_hash, salt, 'staff', '李社工', '和谐社区', 1, now, now)
            )
        
        resident_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'resident1'")
        if not resident_exists:
            salt = secrets.token_hex(8)
            password = '123456'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, real_name, community, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('resident1', password_hash, salt, 'resident', '王居民', '阳光社区', 1, now, now)
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, role: str = 'resident', real_name: str = None, community: str = None) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'role': role,
            'real_name': real_name,
            'community': community,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_role(self, role: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'role': role}, order_by='id ASC')

    def get_staff_list(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'role': 'staff', 'status': 1}, order_by='id ASC')

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
                'role': user.get('role'),
                'real_name': user.get('real_name'),
                'community': user.get('community'),
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
