from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_qx_users'

    LEVEL_NEWBIE = '萌新'
    LEVEL_RIDER = '骑士'
    LEVEL_MASTER = '大神'
    LEVEL_PRO = 'Pro'

    LEVELS = [LEVEL_NEWBIE, LEVEL_RIDER, LEVEL_MASTER, LEVEL_PRO]

    BIKE_TYPE_ROAD = '公路车'
    BIKE_TYPE_MOUNTAIN = '山地车'
    BIKE_TYPE_FOLDING = '折叠车'

    BIKE_TYPES = [BIKE_TYPE_ROAD, BIKE_TYPE_MOUNTAIN, BIKE_TYPE_FOLDING]

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
                phone TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                nickname TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                level TEXT DEFAULT '萌新',
                total_distance REAL DEFAULT 0.0,
                total_duration INTEGER DEFAULT 0,
                avg_speed REAL DEFAULT 0.0,
                bike_type TEXT DEFAULT '公路车',
                bio TEXT DEFAULT '',
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, phone: str, password: str, nickname: str = '',
               avatar: str = '', bike_type: str = BIKE_TYPE_ROAD, bio: str = '') -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'骑友{phone[-4:]}',
            'avatar': avatar or '',
            'level': self.LEVEL_NEWBIE,
            'total_distance': 0.0,
            'total_duration': 0,
            'avg_speed': 0.0,
            'bike_type': bike_type,
            'bio': bio,
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
                'level': user.get('level'),
                'total_distance': user.get('total_distance'),
                'total_duration': user.get('total_duration'),
                'avg_speed': user.get('avg_speed'),
                'bike_type': user.get('bike_type'),
                'bio': user.get('bio'),
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
            'nickname', 'avatar', 'bike_type', 'bio'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(user_id, update_data)

    def update_stats(self, user_id: int, distance: float, duration: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        old_distance = user.get('total_distance', 0) or 0
        old_duration = user.get('total_duration', 0) or 0
        old_avg = user.get('avg_speed', 0) or 0

        new_distance = old_distance + distance
        new_duration = old_duration + duration

        new_avg = 0
        if new_duration > 0:
            new_avg = (new_distance * 60) / new_duration

        level = self.LEVEL_NEWBIE
        if new_distance >= 500:
            level = self.LEVEL_PRO
        elif new_distance >= 200:
            level = self.LEVEL_MASTER
        elif new_distance >= 50:
            level = self.LEVEL_RIDER

        now = datetime.now().isoformat()
        data = {
            'total_distance': round(new_distance, 2),
            'total_duration': new_duration,
            'avg_speed': round(new_avg, 2),
            'level': level,
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

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                level: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if level:
            conditions['level'] = level

        if keyword:
            return self.search(keyword, page, page_size, status, level)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, level: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if level:
            where_clauses.append("level = ?")
            params.append(level)

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

    def get_ranking(self, sort_by: str = 'distance', page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        order_field = 'total_distance' if sort_by == 'distance' else 'avg_speed'

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE status = 0"
        total_result = self.db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = 0
            ORDER BY {order_field} DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql)

        return {
            'items': [self.to_public_dict(item) for item in items],
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

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
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'level': user.get('level'),
            'total_distance': user.get('total_distance'),
            'total_duration': user.get('total_duration'),
            'avg_speed': user.get('avg_speed'),
            'bike_type': user.get('bike_type'),
            'bio': user.get('bio'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }
