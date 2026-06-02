from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_wangzhe_model_users'

    STATUS_ACTIVE = 0
    STATUS_MUTED = 1
    STATUS_BANNED = 2

    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'

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
                role TEXT DEFAULT 'user',
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                gold INTEGER DEFAULT 10000,
                diamonds INTEGER DEFAULT 0,
                win_count INTEGER DEFAULT 0,
                lose_count INTEGER DEFAULT 0,
                total_kills INTEGER DEFAULT 0,
                total_deaths INTEGER DEFAULT 0,
                total_assists INTEGER DEFAULT 0,
                ranking_points INTEGER DEFAULT 1000,
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_ranking ON {cls.TABLE_NAME}(ranking_points DESC)"
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
            'nickname': nickname or f'召唤师{username[-4:]}',
            'avatar': '',
            'role': self.ROLE_USER,
            'level': 1,
            'experience': 0,
            'gold': 10000,
            'diamonds': 0,
            'win_count': 0,
            'lose_count': 0,
            'total_kills': 0,
            'total_deaths': 0,
            'total_assists': 0,
            'ranking_points': 1000,
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
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'role': user.get('role'),
                'level': user.get('level'),
                'gold': user.get('gold'),
                'diamonds': user.get('diamonds'),
                'ranking_points': user.get('ranking_points'),
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

    def update_game_stats(self, user_id: int, win: bool, kills: int, deaths: int, assists: int, points_delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        now = datetime.now().isoformat()
        data = {
            'win_count': user.get('win_count', 0) + (1 if win else 0),
            'lose_count': user.get('lose_count', 0) + (0 if win else 1),
            'total_kills': user.get('total_kills', 0) + kills,
            'total_deaths': user.get('total_deaths', 0) + deaths,
            'total_assists': user.get('total_assists', 0) + assists,
            'ranking_points': max(0, user.get('ranking_points', 1000) + points_delta),
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def update_gold(self, user_id: int, delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        now = datetime.now().isoformat()
        new_gold = max(0, user.get('gold', 0) + delta)
        data = {
            'gold': new_gold,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def add_experience(self, user_id: int, exp: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        current_exp = user.get('experience', 0) + exp
        current_level = user.get('level', 1)
        exp_needed = current_level * 100

        while current_exp >= exp_needed:
            current_exp -= exp_needed
            current_level += 1
            exp_needed = current_level * 100

        now = datetime.now().isoformat()
        data = {
            'experience': current_exp,
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

    def get_ranking_list(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = ?"
        total_result = self.db.fetch_one(count_sql, (self.STATUS_ACTIVE,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ?
            ORDER BY ranking_points DESC, win_count DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (self.STATUS_ACTIVE,))

        ranked_items = []
        for i, item in enumerate(items):
            item_dict = dict(item)
            item_dict['rank'] = offset + i + 1
            ranked_items.append(item_dict)

        return {
            'items': ranked_items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_rank(self, user_id: int) -> Optional[int]:
        sql = f"""
            SELECT COUNT(*) as rank FROM {self.TABLE_NAME} 
            WHERE status = ? AND (ranking_points > (SELECT ranking_points FROM {self.TABLE_NAME} WHERE id = ?) 
            OR (ranking_points = (SELECT ranking_points FROM {self.TABLE_NAME} WHERE id = ?) AND id <= ?))
        """
        result = self.db.fetch_one(sql, (self.STATUS_ACTIVE, user_id, user_id, user_id))
        return result['rank'] if result else None

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
            'role': user.get('role'),
            'level': user.get('level'),
            'experience': user.get('experience'),
            'gold': user.get('gold'),
            'diamonds': user.get('diamonds'),
            'win_count': user.get('win_count'),
            'lose_count': user.get('lose_count'),
            'total_kills': user.get('total_kills'),
            'total_deaths': user.get('total_deaths'),
            'total_assists': user.get('total_assists'),
            'ranking_points': user.get('ranking_points'),
            'rank': user.get('rank'),
            'win_rate': round(user.get('win_count', 0) / max(1, user.get('win_count', 0) + user.get('lose_count', 0)) * 100, 2),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }
