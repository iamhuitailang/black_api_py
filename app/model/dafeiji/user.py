from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import jwt
import bcrypt
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec

SECRET_KEY = "dafeiji_game_secret_key_2024"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24


class DafeijiUserModel:
    TABLE_NAME = 'tb_dafeiji_user'

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
                role TEXT DEFAULT 'user',
                status INTEGER DEFAULT 1,
                total_score INTEGER DEFAULT 0,
                total_kills INTEGER DEFAULT 0,
                highest_wave INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)

        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            password = 'admin123'
            password_hash = cls._hash_password(password)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                ('admin', password_hash, 'admin', 1, now, now)
            )

    @staticmethod
    def _hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def _verify_password(password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def create_token(user_id: int, username: str, role: str) -> str:
        expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
        payload = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "exp": expire
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def create(self, username: str, password: str, role: str = 'user') -> int:
        password_hash = self._hash_password(password)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'role': role,
            'status': 1,
            'total_score': 0,
            'total_kills': 0,
            'highest_wave': 0,
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

        password_hash = user.get('password_hash', '')
        if not self._verify_password(password, password_hash):
            return None

        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'role': user.get('role'),
            'status': user.get('status')
        }

    def update_password(self, user_id: int, new_password: str) -> int:
        password_hash = self._hash_password(new_password)
        now = datetime.now().isoformat()
        data = {
            'password_hash': password_hash,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_stats(self, user_id: int, score: int, kills: int, wave: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        now = datetime.now().isoformat()
        data = {
            'total_score': user.get('total_score', 0) + score,
            'total_kills': user.get('total_kills', 0) + kills,
            'highest_wave': max(user.get('highest_wave', 0), wave),
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

    def update_role(self, user_id: int, role: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'role': role,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        items = self.query.find_all(order_by='id DESC', limit=page_size, offset=offset)
        total = self.query.count()
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size
        }

    def count(self) -> int:
        return self.query.count()
