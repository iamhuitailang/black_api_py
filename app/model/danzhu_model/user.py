from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_danzhu_model_users'

    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'

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
                role TEXT DEFAULT 'user',
                total_score INTEGER DEFAULT 0,
                highest_score INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                combo_max INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_highest_score ON {cls.TABLE_NAME}(highest_score DESC)"
        db.execute(index_sql)

    @classmethod
    def init_default_users(cls):
        model = cls()
        existing = model.get_by_username('admin')
        if not existing:
            model.create(
                username='admin',
                password='admin123',
                nickname='系统管理员',
                role=cls.ROLE_ADMIN
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '', 
               role: str = ROLE_USER, avatar: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'玩家{username[-4:]}',
            'avatar': avatar,
            'role': role,
            'total_score': 0,
            'highest_score': 0,
            'games_played': 0,
            'combo_max': 0,
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
                'role': user.get('role'),
                'total_score': user.get('total_score'),
                'highest_score': user.get('highest_score'),
                'games_played': user.get('games_played'),
                'combo_max': user.get('combo_max'),
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

    def update_game_stats(self, user_id: int, score: int, combo: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        now = datetime.now().isoformat()
        data = {
            'total_score': user.get('total_score', 0) + score,
            'highest_score': max(user.get('highest_score', 0), score),
            'games_played': user.get('games_played', 0) + 1,
            'combo_max': max(user.get('combo_max', 0), combo),
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                role: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if role:
            conditions['role'] = role

        if keyword:
            return self.search(keyword, page, page_size, status, role)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, role: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if role:
            where_clauses.append("role = ?")
            params.append(role)

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

    def get_leaderboard(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = ? AND role = ?"
        total_result = self.db.fetch_one(count_sql, (self.STATUS_ACTIVE, self.ROLE_USER))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND role = ?
            ORDER BY highest_score DESC, id ASC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (self.STATUS_ACTIVE, self.ROLE_USER))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_rank(self, user_id: int) -> int:
        user = self.get_by_id(user_id)
        if not user or user.get('role') != self.ROLE_USER:
            return -1

        sql = f"""
            SELECT COUNT(*) + 1 as rank 
            FROM {self.TABLE_NAME} 
            WHERE status = ? AND role = ? AND highest_score > ?
        """
        result = self.db.fetch_one(sql, (self.STATUS_ACTIVE, self.ROLE_USER, user.get('highest_score', 0)))
        return result['rank'] if result else -1

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
            'total_score': user.get('total_score'),
            'highest_score': user.get('highest_score'),
            'games_played': user.get('games_played'),
            'combo_max': user.get('combo_max'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }
