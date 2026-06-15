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
                nickname TEXT,
                avatar_url TEXT,
                credit_score REAL DEFAULT 5.0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        
        admin_exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE username = 'admin'")
        if not admin_exists:
            salt = secrets.token_hex(8)
            password = 'admin123'
            password_hash = cls._hash_password(password, salt)
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (username, password_hash, salt, nickname, avatar_url, credit_score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('admin', password_hash, salt, '管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 5.0, 1, now, now)
            )

    @classmethod
    def migrate_add_profile_fields(cls):
        db = get_db()
        columns = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        column_names = [col['name'] for col in columns]
        
        migrated = False
        if 'nickname' not in column_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN nickname TEXT")
            migrated = True
        if 'avatar_url' not in column_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN avatar_url TEXT")
            migrated = True
        if 'credit_score' not in column_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN credit_score REAL DEFAULT 5.0")
            migrated = True
        
        if migrated:
            db.execute(f"UPDATE {cls.TABLE_NAME} SET nickname = username WHERE nickname IS NULL")
            db.execute(f"UPDATE {cls.TABLE_NAME} SET avatar_url = '/static/community/images/avatar1.svg' WHERE avatar_url IS NULL")
            db.execute(f"UPDATE {cls.TABLE_NAME} SET credit_score = 5.0 WHERE credit_score IS NULL")
        
        return migrated

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = None) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        avatar_idx = (abs(hash(username)) % 4) + 1
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'avatar_url': f'/static/community/images/avatar{avatar_idx}.svg',
            'credit_score': 5.0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        user = self.query.find_by_id(record_id)
        if user:
            user.pop('password_hash', None)
            user.pop('salt', None)
        return user

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

    def update_profile(self, user_id: int, nickname: str = None, avatar_url: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if nickname is not None:
            data['nickname'] = nickname
        if avatar_url is not None:
            data['avatar_url'] = avatar_url
        return self.exec.update_by_id(user_id, data)

    def update_credit_score(self, user_id: int, credit_score: float) -> int:
        now = datetime.now().isoformat()
        data = {
            'credit_score': credit_score,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def get_public_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        user = self.query.find_one({'id': user_id}, fields=['id', 'username', 'nickname', 'avatar_url', 'credit_score', 'created_at'])
        return user

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        users = self.query.find_all(order_by='id ASC')
        for user in users:
            user.pop('password_hash', None)
            user.pop('salt', None)
        return users
