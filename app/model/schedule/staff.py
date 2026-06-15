from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class StaffModel:
    TABLE_NAME = 'staff'

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
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'staff',
                password_hash TEXT,
                salt TEXT,
                token TEXT,
                token_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN password_hash TEXT")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN salt TEXT")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN token TEXT")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN token_expires_at TIMESTAMP")
        except Exception:
            pass

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, name: str, role: str = 'staff', password: str = '123456') -> int:
        now = datetime.now().isoformat()
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        data = {
            'name': name,
            'role': role,
            'password_hash': password_hash,
            'salt': salt,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def verify_password(self, name: str, password: str) -> Optional[Dict[str, Any]]:
        staff = self.query.find_one({'name': name})
        if not staff:
            return None

        salt = staff.get('salt', '')
        password_hash = staff.get('password_hash', '')
        if not salt or not password_hash:
            return None

        if self._hash_password(password, salt) == password_hash:
            return {
                'id': staff.get('id'),
                'name': staff.get('name'),
                'role': staff.get('role')
            }
        return None

    def generate_token(self, staff_id: int, hours: int = 24) -> str:
        token = secrets.token_hex(32)
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        self.exec.update_by_id(staff_id, {
            'token': token,
            'token_expires_at': expires_at,
            'updated_at': datetime.now().isoformat()
        })
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        staff = self.query.find_one({'token': token})
        if not staff:
            return None

        expires_at = staff.get('token_expires_at')
        if expires_at:
            try:
                if isinstance(expires_at, str):
                    expires_dt = datetime.fromisoformat(expires_at)
                else:
                    expires_dt = expires_at
                if expires_dt < datetime.now():
                    return None
            except (ValueError, TypeError):
                pass

        return {
            'id': staff.get('id'),
            'name': staff.get('name'),
            'role': staff.get('role')
        }

    def clear_token(self, staff_id: int) -> int:
        return self.exec.update_by_id(staff_id, {
            'token': None,
            'token_expires_at': None,
            'updated_at': datetime.now().isoformat()
        })

    def get_by_id(self, staff_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(staff_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_role(self, role: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'role': role}, order_by='id ASC')

    def update(self, staff_id: int, name: str = None, role: str = None, password: str = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if role is not None:
            data['role'] = role
        if password is not None:
            salt = secrets.token_hex(8)
            data['password_hash'] = self._hash_password(password, salt)
            data['salt'] = salt
        if not data:
            return 0
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(staff_id, data)

    def delete(self, staff_id: int) -> int:
        return self.exec.delete_by_id(staff_id)

    def count(self) -> int:
        return self.query.count()
