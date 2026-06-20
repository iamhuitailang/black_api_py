from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_auth_user'
    ROLE_ADMIN = 'admin'
    ROLE_STUDENT = 'student'
    
    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def migrate_add_role(cls):
        db = get_db()
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN role TEXT DEFAULT 'student'")
            db.execute(f"UPDATE {cls.TABLE_NAME} SET role = 'admin' WHERE username = 'admin'")
            print(f"  - Migrated {cls.TABLE_NAME}: added role column")
            return True
        except Exception:
            return False

    @classmethod
    def migrate_add_student_fields(cls):
        db = get_db()
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN student_id TEXT DEFAULT ''")
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN real_name TEXT DEFAULT ''")
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN phone TEXT DEFAULT ''")
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN major TEXT DEFAULT ''")
            print(f"  - Migrated {cls.TABLE_NAME}: added student fields")
            return True
        except Exception:
            return False

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                student_id TEXT DEFAULT '',
                real_name TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                major TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        try:
            index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_student_id ON {cls.TABLE_NAME}(student_id)"
            db.execute(index_sql2)
        except Exception:
            pass
        
        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            salt = secrets.token_hex(8)
            password = 'admin123'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ('admin', password_hash, salt, cls.ROLE_ADMIN, 1, now, now)
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, role: str = 'student',
               student_id: str = '', real_name: str = '', phone: str = '', major: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'role': role,
            'student_id': student_id,
            'real_name': real_name,
            'phone': phone,
            'major': major,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def get_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'student_id': student_id})

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
                'role': user.get('role', 'student'),
                'student_id': user.get('student_id', ''),
                'real_name': user.get('real_name', ''),
                'phone': user.get('phone', ''),
                'major': user.get('major', ''),
                'status': user.get('status')
            }
        return None

    def update_profile(self, user_id: int, real_name: str = None, phone: str = None, 
                       major: str = None, student_id: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if real_name is not None:
            data['real_name'] = real_name
        if phone is not None:
            data['phone'] = phone
        if major is not None:
            data['major'] = major
        if student_id is not None:
            data['student_id'] = student_id
        
        return self.exec.update_by_id(user_id, data)

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

    def count_by_role(self, role: str) -> int:
        return self.query.count({'role': role})
