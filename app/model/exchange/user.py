from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class ExUserModel:
    TABLE_NAME = 'tb_ex_users'
    
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
                nickname TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                credit_score INTEGER DEFAULT 80,
                city TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                exchange_count INTEGER DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                avg_description REAL DEFAULT 0.0,
                avg_attitude REAL DEFAULT 0.0,
                avg_efficiency REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_credit ON {cls.TABLE_NAME}(credit_score)"
        db.execute(index_sql3)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, phone: str, password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': '',
            'avatar_url': '',
            'credit_score': 80,
            'city': '',
            'status': 1,
            'exchange_count': 0,
            'review_count': 0,
            'avg_description': 0.0,
            'avg_attitude': 0.0,
            'avg_efficiency': 0.0,
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
                'avatar_url': user.get('avatar_url'),
                'credit_score': user.get('credit_score'),
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

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'nickname', 'avatar_url', 'city'
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

    def update_credit_after_review(self, user_id: int, description: int, attitude: int, efficiency: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        
        review_count = user.get('review_count', 0) + 1
        old_desc = user.get('avg_description', 0.0)
        old_att = user.get('avg_attitude', 0.0)
        old_eff = user.get('avg_efficiency', 0.0)
        
        new_desc = (old_desc * (review_count - 1) + description) / review_count
        new_att = (old_att * (review_count - 1) + attitude) / review_count
        new_eff = (old_eff * (review_count - 1) + efficiency) / review_count
        
        avg_total = (new_desc + new_att + new_eff) / 3
        credit_score = min(100, int(avg_total * 20))
        
        now = datetime.now().isoformat()
        data = {
            'review_count': review_count,
            'avg_description': round(new_desc, 2),
            'avg_attitude': round(new_att, 2),
            'avg_efficiency': round(new_eff, 2),
            'credit_score': credit_score,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def get_all(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar_url': user.get('avatar_url'),
            'credit_score': user.get('credit_score'),
            'city': user.get('city'),
            'status': user.get('status'),
            'exchange_count': user.get('exchange_count'),
            'review_count': user.get('review_count'),
            'avg_description': user.get('avg_description'),
            'avg_attitude': user.get('avg_attitude'),
            'avg_efficiency': user.get('avg_efficiency'),
            'created_at': user.get('created_at')
        }


class ExTokenModel:
    TABLE_NAME = 'tb_ex_token'
    
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
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_token ON {cls.TABLE_NAME}(token)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    @staticmethod
    def _generate_token() -> str:
        return secrets.token_hex(32)

    def create_token(self, user_id: int, hours: int = 24) -> str:
        token = self._generate_token()
        expires_at = (datetime.now() + timedelta(hours=hours)).isoformat()
        now = datetime.now().isoformat()
        
        data = {
            'user_id': user_id,
            'token': token,
            'expires_at': expires_at,
            'created_at': now
        }
        
        self.exec.insert(data)
        return token

    def get_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        
        token_record = self.query.find_one({'token': token})
        if not token_record:
            return None
        
        expires_at = token_record.get('expires_at')
        if expires_at:
            try:
                if isinstance(expires_at, str):
                    expires_dt = datetime.fromisoformat(expires_at)
                else:
                    expires_dt = expires_at
                    
                if expires_dt < datetime.now():
                    self.exec.delete_by_id(token_record.get('id'))
                    return None
            except (ValueError, TypeError):
                pass
        
        return token_record

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        token_record = self.get_by_token(token)
        if not token_record:
            return None
        
        user_id = token_record.get('user_id')
        user_model = ExUserModel()
        user = user_model.get_by_id(user_id)
        
        if user:
            return {
                'id': user.get('id'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'avatar_url': user.get('avatar_url'),
                'credit_score': user.get('credit_score'),
                'status': user.get('status')
            }
        return None

    def delete_token(self, token: str) -> int:
        token_record = self.query.find_one({'token': token})
        if token_record:
            return self.exec.delete_by_id(token_record.get('id'))
        return 0

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )
