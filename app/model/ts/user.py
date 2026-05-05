from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class TsUserModel:
    TABLE_NAME = 'tb_ts_user'

    STATUS_ACTIVE = 0
    STATUS_INACTIVE = 1

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
                avatar TEXT DEFAULT '',
                height INTEGER DEFAULT 170,
                weight REAL DEFAULT 60.0,
                daily_goal INTEGER DEFAULT 1000,
                total_count INTEGER DEFAULT 0,
                total_duration INTEGER DEFAULT 0,
                total_calories REAL DEFAULT 0.0,
                streak_days INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, phone: str, password: str, nickname: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'用户{phone[-4:]}',
            'avatar': '',
            'height': 170,
            'weight': 60.0,
            'daily_goal': 1000,
            'total_count': 0,
            'total_duration': 0,
            'total_calories': 0.0,
            'streak_days': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now
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
                'avatar': user.get('avatar'),
                'height': user.get('height'),
                'weight': user.get('weight'),
                'daily_goal': user.get('daily_goal'),
                'total_count': user.get('total_count'),
                'total_duration': user.get('total_duration'),
                'total_calories': user.get('total_calories'),
                'streak_days': user.get('streak_days'),
                'status': user.get('status')
            }
        return None

    def update_password(self, user_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        data = {
            'password_hash': password_hash,
            'salt': salt
        }
        return self.exec.update_by_id(user_id, data)

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'nickname', 'avatar', 'height', 'weight', 'daily_goal'
        ]}
        if update_data:
            return self.exec.update_by_id(user_id, update_data)
        return 0

    def update_stats(self, user_id: int, count: int = 0, duration: int = 0, calories: float = 0.0) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        new_count = user.get('total_count', 0) + count
        new_duration = user.get('total_duration', 0) + duration
        new_calories = user.get('total_calories', 0.0) + calories

        data = {
            'total_count': new_count,
            'total_duration': new_duration,
            'total_calories': new_calories
        }
        return self.exec.update_by_id(user_id, data)

    def update_streak_days(self, user_id: int, streak_days: int) -> int:
        return self.exec.update_by_id(user_id, {'streak_days': streak_days})

    def update_status(self, user_id: int, status: int) -> int:
        return self.exec.update_by_id(user_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if keyword:
            return self.search(keyword, page, page_size)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        where_clauses.append("(phone LIKE ? OR nickname LIKE ?)")
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

    def get_ranking(self, limit: int = 10, order_by: str = 'total_count') -> List[Dict[str, Any]]:
        valid_fields = ['total_count', 'total_duration', 'total_calories', 'streak_days']
        order_field = order_by if order_by in valid_fields else 'total_count'

        sql = f"""
            SELECT id, phone, nickname, avatar, total_count, total_duration, total_calories, streak_days
            FROM {self.TABLE_NAME}
            WHERE status = ?
            ORDER BY {order_field} DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (self.STATUS_ACTIVE, limit))

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'height': user.get('height'),
            'weight': user.get('weight'),
            'daily_goal': user.get('daily_goal'),
            'total_count': user.get('total_count'),
            'total_duration': user.get('total_duration'),
            'total_calories': user.get('total_calories'),
            'streak_days': user.get('streak_days'),
            'status': user.get('status'),
            'created_at': user.get('created_at')
        }
