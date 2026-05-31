from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_doudizhu_model_users'

    STATUS_ACTIVE = 0
    STATUS_MUTED = 1
    STATUS_BANNED = 2

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
                avatar TEXT DEFAULT '',
                coins INTEGER DEFAULT 1000,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                win_count INTEGER DEFAULT 0,
                lose_count INTEGER DEFAULT 0,
                total_games INTEGER DEFAULT 0,
                max_score INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_coins ON {cls.TABLE_NAME}(coins)"
        db.execute(index_sql)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'玩家{username[-4:]}',
            'avatar': '',
            'coins': 1000,
            'level': 1,
            'exp': 0,
            'win_count': 0,
            'lose_count': 0,
            'total_games': 0,
            'max_score': 0,
            'status': self.STATUS_ACTIVE,
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

        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == user.get('password_hash'):
            if user.get('status') == self.STATUS_BANNED:
                return None
            return {
                'id': user.get('id'),
                'username': user.get('username'),
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

        current_coins = user.get('coins', 1000)
        new_coins = max(0, current_coins + delta)

        now = datetime.now().isoformat()
        data = {
            'coins': new_coins,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_game_result(self, user_id: int, is_win: bool, score: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        win_count = user.get('win_count', 0) + (1 if is_win else 0)
        lose_count = user.get('lose_count', 0) + (0 if is_win else 1)
        total_games = user.get('total_games', 0) + 1
        max_score = max(user.get('max_score', 0), score)
        exp = user.get('exp', 0) + (score if is_win else score // 2)
        level = (exp // 100) + 1

        now = datetime.now().isoformat()
        data = {
            'win_count': win_count,
            'lose_count': lose_count,
            'total_games': total_games,
            'max_score': max_score,
            'exp': exp,
            'level': level,
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

        where_clauses.append("(username LIKE ? OR nickname LIKE ?)")
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

    def get_ranking_list(self, page: int = 1, page_size: int = 100, sort_by: str = 'coins') -> Dict[str, Any]:
        valid_sort_fields = ['coins', 'win_count', 'max_score', 'level']
        sort_field = sort_by if sort_by in valid_sort_fields else 'coins'
        conditions = {'status': self.STATUS_ACTIVE}
        return self.query.paginate(page, page_size, conditions, order_by=f'{sort_field} DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '正常',
            self.STATUS_MUTED: '禁言',
            self.STATUS_BANNED: '封号'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'coins': user.get('coins'),
            'level': user.get('level'),
            'exp': user.get('exp'),
            'win_count': user.get('win_count'),
            'lose_count': user.get('lose_count'),
            'total_games': user.get('total_games'),
            'max_score': user.get('max_score'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }
