from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_dd_users'
    
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
                avatar_url TEXT DEFAULT '',
                nickname TEXT DEFAULT '',
                real_name TEXT DEFAULT '',
                id_card TEXT DEFAULT '',
                is_verified INTEGER DEFAULT 0,
                credit_score INTEGER DEFAULT 100,
                total_orders INTEGER DEFAULT 0,
                positive_reviews INTEGER DEFAULT 0,
                negative_reviews INTEGER DEFAULT 0,
                positive_rate REAL DEFAULT 100.0,
                wechat_qrcode_url TEXT DEFAULT '',
                contact_phone TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_verified ON {cls.TABLE_NAME}(is_verified)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_credit_score ON {cls.TABLE_NAME}(credit_score)"
        db.execute(index_sql)

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
            'avatar_url': '',
            'nickname': '',
            'real_name': '',
            'id_card': '',
            'is_verified': 0,
            'credit_score': 100,
            'total_orders': 0,
            'positive_reviews': 0,
            'negative_reviews': 0,
            'positive_rate': 100.0,
            'wechat_qrcode_url': '',
            'contact_phone': '',
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
                'is_verified': user.get('is_verified'),
                'credit_score': user.get('credit_score')
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
            'avatar_url', 'nickname', 'real_name', 'id_card', 'contact_phone', 'wechat_qrcode_url'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(user_id, update_data)

    def verify_user(self, user_id: int, real_name: str, id_card: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'real_name': real_name,
            'id_card': id_card,
            'is_verified': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_credit_score(self, user_id: int, delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        
        current_score = user.get('credit_score', 100)
        new_score = max(0, min(100, current_score + delta))
        
        now = datetime.now().isoformat()
        data = {
            'credit_score': new_score,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_review_stats(self, user_id: int, is_positive: bool) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        
        positive = user.get('positive_reviews', 0)
        negative = user.get('negative_reviews', 0)
        total_orders = user.get('total_orders', 0) + 1
        
        if is_positive:
            positive += 1
        else:
            negative += 1
        
        total_reviews = positive + negative
        positive_rate = (positive / total_reviews * 100) if total_reviews > 0 else 100.0
        
        now = datetime.now().isoformat()
        data = {
            'total_orders': total_orders,
            'positive_reviews': positive,
            'negative_reviews': negative,
            'positive_rate': round(positive_rate, 2),
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'phone': user.get('phone'),
            'avatar_url': user.get('avatar_url'),
            'nickname': user.get('nickname'),
            'is_verified': user.get('is_verified'),
            'credit_score': user.get('credit_score'),
            'total_orders': user.get('total_orders'),
            'positive_reviews': user.get('positive_reviews'),
            'negative_reviews': user.get('negative_reviews'),
            'positive_rate': user.get('positive_rate'),
            'contact_phone': user.get('contact_phone'),
            'wechat_qrcode_url': user.get('wechat_qrcode_url'),
            'created_at': user.get('created_at')
        }
