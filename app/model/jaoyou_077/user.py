from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_jaoyou_077_model_users'

    GENDER_MALE = 1
    GENDER_FEMALE = 2

    STATUS_PENDING = 0
    STATUS_ACTIVE = 1
    STATUS_REJECTED = 2
    STATUS_BANNED = 3

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
                gender INTEGER DEFAULT 1,
                age INTEGER DEFAULT 0,
                height INTEGER DEFAULT 0,
                weight INTEGER DEFAULT 0,
                education TEXT DEFAULT '',
                occupation TEXT DEFAULT '',
                income TEXT DEFAULT '',
                city TEXT DEFAULT '',
                district TEXT DEFAULT '',
                introduction TEXT DEFAULT '',
                interest TEXT DEFAULT '',
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_gender ON {cls.TABLE_NAME}(gender)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city ON {cls.TABLE_NAME}(city)"
        db.execute(index_sql)

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, phone: str, password: str, nickname: str = '', gender: int = 1) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'用户{phone[-4:]}',
            'avatar': '',
            'gender': gender,
            'age': 0,
            'height': 0,
            'weight': 0,
            'education': '',
            'occupation': '',
            'income': '',
            'city': '',
            'district': '',
            'introduction': '',
            'interest': '',
            'status': self.STATUS_PENDING,
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
                'gender': user.get('gender'),
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
            'nickname', 'avatar', 'gender', 'age', 'height', 'weight',
            'education', 'occupation', 'income', 'city', 'district',
            'introduction', 'interest'
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

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                gender: int = None, city: str = None, keyword: str = None, exclude_user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if gender is not None:
            conditions['gender'] = gender

        if keyword or city or exclude_user_id:
            return self.search(keyword, page, page_size, status, gender, city, exclude_user_id)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, gender: int = None, city: str = None, exclude_user_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if gender is not None:
            where_clauses.append("gender = ?")
            params.append(gender)

        if city:
            where_clauses.append("city LIKE ?")
            params.append(f"%{city}%")

        if exclude_user_id:
            where_clauses.append("id != ?")
            params.append(exclude_user_id)

        if keyword:
            where_clauses.append("(phone LIKE ? OR nickname LIKE ? OR occupation LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

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

    def get_gender_text(self, gender: int) -> str:
        gender_map = {
            self.GENDER_MALE: '男',
            self.GENDER_FEMALE: '女'
        }
        return gender_map.get(gender, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_ACTIVE: '已通过',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_BANNED: '已封禁'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'gender': user.get('gender'),
            'gender_text': self.get_gender_text(user.get('gender')),
            'age': user.get('age'),
            'height': user.get('height'),
            'weight': user.get('weight'),
            'education': user.get('education'),
            'occupation': user.get('occupation'),
            'income': user.get('income'),
            'city': user.get('city'),
            'district': user.get('district'),
            'introduction': user.get('introduction'),
            'interest': user.get('interest'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }

    def count_users(self, status: int = None, gender: int = None) -> int:
        where_clauses = ["1=1"]
        params = []
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if gender is not None:
            where_clauses.append("gender = ?")
            params.append(gender)

        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        result = self.db.fetch_one(sql, tuple(params))
        return result.get('total', 0) if result else 0
