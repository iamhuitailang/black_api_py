from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class JianshenUserModel:
    TABLE_NAME = 'tb_jianshen_users'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                nickname TEXT DEFAULT '',
                email TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                total_checkins INTEGER DEFAULT 0,
                consecutive_days INTEGER DEFAULT 0,
                last_checkin_date TEXT DEFAULT '',
                notification_enabled INTEGER DEFAULT 1,
                theme TEXT DEFAULT 'light',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_email ON {cls.TABLE_NAME}(email)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)")

    @classmethod
    def init_default_users(cls):
        model = cls()
        demo_users = [
            {'username': 'fitness001', 'password': '123456', 'nickname': '健身达人小明'},
            {'username': 'fitness002', 'password': '123456', 'nickname': '跑步王子'},
            {'username': 'fitness003', 'password': '123456', 'nickname': '瑜伽姐姐'},
        ]
        for u in demo_users:
            if not model.get_by_username(u['username']):
                model.create(**u)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '', email: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or username,
            'email': email,
            'avatar': '',
            'level': 1,
            'exp': 0,
            'total_checkins': 0,
            'consecutive_days': 0,
            'last_checkin_date': '',
            'notification_enabled': 1,
            'theme': 'light',
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'email': email})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            return None
        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)
        if password_hash == user.get('password_hash'):
            if user.get('status') == self.STATUS_DISABLED:
                return None
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'email': user.get('email'),
                'avatar': user.get('avatar'),
                'level': user.get('level'),
                'exp': user.get('exp'),
                'status': user.get('status')
            }
        return None

    def update_password(self, user_id: int, new_password: str) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(new_password, salt)
        return self.exec.update_by_id(user_id, {
            'password_hash': password_hash,
            'salt': salt,
            'updated_at': datetime.now().isoformat()
        })

    def update_profile(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items()
                       if k in ['nickname', 'email', 'avatar']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(user_id, update_data)

    def update_settings(self, user_id: int, notification_enabled: int = None, theme: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if notification_enabled is not None:
            data['notification_enabled'] = notification_enabled
        if theme is not None:
            data['theme'] = theme
        return self.exec.update_by_id(user_id, data)

    def update_status(self, user_id: int, status: int) -> int:
        return self.exec.update_by_id(user_id, {
            'status': status,
            'updated_at': datetime.now().isoformat()
        })

    def add_exp(self, user_id: int, exp: int) -> Dict[str, Any]:
        user = self.get_by_id(user_id)
        if not user:
            return {'leveled_up': False, 'new_level': 0}
        current_exp = user.get('exp', 0) + exp
        current_level = user.get('level', 1)
        new_level = current_level
        # Level up: every 100 exp per level
        while current_exp >= new_level * 100:
            current_exp -= new_level * 100
            new_level += 1
        leveled_up = new_level > current_level
        self.exec.update_by_id(user_id, {
            'exp': current_exp,
            'level': new_level,
            'updated_at': datetime.now().isoformat()
        })
        return {'leveled_up': leveled_up, 'new_level': new_level, 'exp_gained': exp}

    def increment_checkin_stats(self, user_id: int, checkin_date: str) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        new_total = user.get('total_checkins', 0) + 1
        last_date = user.get('last_checkin_date', '')
        new_consecutive = user.get('consecutive_days', 0)
        if last_date and checkin_date:
            try:
                from datetime import date as date_type, timedelta as td
                last = date_type.fromisoformat(last_date)
                cur = date_type.fromisoformat(checkin_date)
                if cur == last:
                    pass
                elif cur == last + td(days=1):
                    new_consecutive += 1
                else:
                    new_consecutive = 1
            except (ValueError, TypeError):
                new_consecutive = 1
        else:
            new_consecutive = 1
        self.exec.update_by_id(user_id, {
            'total_checkins': new_total,
            'consecutive_days': new_consecutive,
            'last_checkin_date': checkin_date,
            'updated_at': datetime.now().isoformat()
        })
        return new_total

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        if keyword:
            return self.search(keyword, page, page_size, status)
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        where_clauses.append("(username LIKE ? OR nickname LIKE ? OR email LIKE ?)")
        like = f"%{keyword}%"
        params.extend([like, like, like])
        total_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total = self.db.fetch_one(total_sql, tuple(params))['total']
        select_sql = f"SELECT * FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)} ORDER BY id DESC LIMIT {page_size} OFFSET {offset}"
        items = self.db.fetch_all(select_sql, tuple(params))
        return {'items': items, 'total': total, 'page': page, 'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size}

    def get_ranking(self, by: str = 'total', limit: int = 50) -> list:
        order_map = {
            'total': 'total_checkins DESC',
            'consecutive': 'consecutive_days DESC',
            'level': 'level DESC, exp DESC'
        }
        order = order_map.get(by, 'total_checkins DESC')
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE status = 0 ORDER BY {order} LIMIT {limit}"
        return self.db.fetch_all(sql)

    def get_rank(self, user_id: int, by: str = 'total') -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        if by == 'total':
            sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE status = 0 AND total_checkins > ?"
            cnt = self.db.fetch_one(sql, (user.get('total_checkins', 0),))
        elif by == 'consecutive':
            sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE status = 0 AND consecutive_days > ?"
            cnt = self.db.fetch_one(sql, (user.get('consecutive_days', 0),))
        else:
            sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE status = 0 AND (level > ? OR (level = ? AND exp > ?))"
            cnt = self.db.fetch_one(sql, (user.get('level', 1), user.get('level', 1), user.get('exp', 0)))
        return (cnt['cnt'] if cnt else 0) + 1

    def to_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'email': user.get('email'),
            'avatar': user.get('avatar'),
            'level': user.get('level'),
            'exp': user.get('exp'),
            'total_checkins': user.get('total_checkins'),
            'consecutive_days': user.get('consecutive_days'),
            'last_checkin_date': user.get('last_checkin_date'),
            'notification_enabled': user.get('notification_enabled'),
            'theme': user.get('theme'),
            'status': user.get('status'),
            'created_at': user.get('created_at')
        }

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'level': user.get('level'),
            'exp': user.get('exp'),
            'total_checkins': user.get('total_checkins'),
            'consecutive_days': user.get('consecutive_days')
        }
