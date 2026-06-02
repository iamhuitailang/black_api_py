from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_saiche_model_users'

    STATUS_ACTIVE = 0
    STATUS_BANNED = 1

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
                coins INTEGER DEFAULT 1000,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

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
            'nickname': nickname or f'车手{phone[-4:]}',
            'avatar': '',
            'coins': 1000,
            'level': 1,
            'exp': 0,
            'status': self.STATUS_ACTIVE,
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
                'avatar': user.get('avatar'),
                'coins': user.get('coins'),
                'level': user.get('level'),
                'exp': user.get('exp'),
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
            'nickname', 'avatar'
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

    def update_coins(self, user_id: int, delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        current_coins = user.get('coins', 0)
        new_coins = max(0, current_coins + delta)

        now = datetime.now().isoformat()
        data = {
            'coins': new_coins,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_exp(self, user_id: int, delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        current_exp = user.get('exp', 0)
        current_level = user.get('level', 1)
        new_exp = current_exp + delta

        exp_needed = current_level * 1000
        while new_exp >= exp_needed:
            new_exp -= exp_needed
            current_level += 1
            exp_needed = current_level * 1000

        now = datetime.now().isoformat()
        data = {
            'exp': new_exp,
            'level': current_level,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_BANNED: '封禁'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'coins': user.get('coins'),
            'level': user.get('level'),
            'exp': user.get('exp'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }

    def get_rank_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        sql = f"""
            SELECT u.*, 
                   COALESCE((SELECT AVG(finish_time) FROM tb_saiche_model_race_records WHERE user_id = u.id AND is_winner = 1), 9999) as avg_time,
                   COALESCE((SELECT COUNT(*) FROM tb_saiche_model_race_records WHERE user_id = u.id AND is_winner = 1), 0) as win_count
            FROM {self.TABLE_NAME} u
            WHERE u.status = {self.STATUS_ACTIVE}
            ORDER BY win_count DESC, avg_time ASC, u.level DESC, u.exp DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(sql)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = {self.STATUS_ACTIVE}"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        result_items = []
        for idx, item in enumerate(items):
            rank = offset + idx + 1
            user_dict = self.to_public_dict(item)
            user_dict['rank'] = rank
            user_dict['win_count'] = item.get('win_count', 0)
            user_dict['avg_time'] = round(item.get('avg_time', 0), 2) if item.get('avg_time') < 9999 else None
            result_items.append(user_dict)

        return {
            'items': result_items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_rank(self, user_id: int) -> Optional[int]:
        sql = f"""
            SELECT u.id
            FROM {self.TABLE_NAME} u
            WHERE u.status = {self.STATUS_ACTIVE}
            ORDER BY 
                COALESCE((SELECT COUNT(*) FROM tb_saiche_model_race_records WHERE user_id = u.id AND is_winner = 1), 0) DESC,
                COALESCE((SELECT AVG(finish_time) FROM tb_saiche_model_race_records WHERE user_id = u.id AND is_winner = 1), 9999) ASC,
                u.level DESC, u.exp DESC
        """
        items = self.db.fetch_all(sql)
        for idx, item in enumerate(items):
            if item.get('id') == user_id:
                return idx + 1
        return None
