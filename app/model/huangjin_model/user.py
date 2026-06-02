from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class HuangjinUserModel:
    TABLE_NAME = 'tb_huangjin_model_user'

    ROLE_USER = 0
    ROLE_ADMIN = 1

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
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                nickname TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                role INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                total_games INTEGER DEFAULT 0,
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_score ON {cls.TABLE_NAME}(total_score DESC)"
        db.execute(index_sql)

    @classmethod
    def init_default_admin(cls):
        model = cls()
        existing = model.get_by_username('admin')
        if not existing:
            model.create(
                username='admin',
                password='admin123',
                nickname='管理员',
                role=cls.ROLE_ADMIN
            )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, password: str, nickname: str = '', role: int = 0) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'矿工{username}',
            'avatar': '',
            'role': role,
            'total_score': 0,
            'best_score': 0,
            'total_games': 0,
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
                'best_score': user.get('best_score'),
                'total_games': user.get('total_games'),
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

    def update_score(self, user_id: int, score: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0
        now = datetime.now().isoformat()
        new_total = user.get('total_score', 0) + score
        new_best = max(user.get('best_score', 0), score)
        new_games = user.get('total_games', 0) + 1
        data = {
            'total_score': new_total,
            'best_score': new_best,
            'total_games': new_games,
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

    def update_role(self, user_id: int, role: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'role': role,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                role: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if role is not None:
            conditions['role'] = role

        if keyword:
            return self.search(keyword, page, page_size, status, role)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, role: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if role is not None:
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
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = {self.STATUS_ACTIVE}"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT id, username, nickname, avatar, total_score, best_score, total_games
            FROM {self.TABLE_NAME}
            WHERE status = {self.STATUS_ACTIVE}
            ORDER BY total_score DESC, best_score DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql)
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'role': user.get('role'),
            'total_score': user.get('total_score'),
            'best_score': user.get('best_score'),
            'total_games': user.get('total_games'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'role_text': self.get_role_text(user.get('role')),
            'created_at': user.get('created_at')
        }

    @staticmethod
    def get_status_text(status: int) -> str:
        status_map = {0: '正常', 1: '封号'}
        return status_map.get(status, '未知')

    @staticmethod
    def get_role_text(role: int) -> str:
        role_map = {0: '玩家', 1: '管理员'}
        return role_map.get(role, '未知')
