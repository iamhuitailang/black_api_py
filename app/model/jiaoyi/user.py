from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import hashlib
import secrets


class UserModel:
    TABLE_NAME = 'tb_jiaoyi_model_users'

    ROLE_BUYER = 'buyer'
    ROLE_SELLER = 'seller'
    ROLE_BOTH = 'both'

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
                phone TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                nickname TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                school TEXT DEFAULT '',
                major TEXT DEFAULT '',
                grade TEXT DEFAULT '',
                role TEXT DEFAULT 'buyer',
                credit INTEGER DEFAULT 100,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_username ON {cls.TABLE_NAME}(username)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_school ON {cls.TABLE_NAME}(school)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_users(cls):
        model = cls()
        default_users = [
            {
                'username': 'buyer001',
                'phone': '13800138001',
                'password': '123456',
                'nickname': '学霸小明',
                'school': '清华大学',
                'major': '计算机科学',
                'grade': '2022级',
                'role': cls.ROLE_BOTH
            },
            {
                'username': 'seller001',
                'phone': '13800138002',
                'password': '123456',
                'nickname': '教材达人',
                'school': '北京大学',
                'major': '软件工程',
                'grade': '2021级',
                'role': cls.ROLE_SELLER
            },
            {
                'username': 'student001',
                'phone': '13800138003',
                'password': '123456',
                'nickname': '爱学习的小红',
                'school': '复旦大学',
                'major': '数学',
                'grade': '2023级',
                'role': cls.ROLE_BUYER
            }
        ]
        
        for user_data in default_users:
            existing = model.get_by_username(user_data['username'])
            if not existing:
                model.create(
                    username=user_data['username'],
                    phone=user_data['phone'],
                    password=user_data['password'],
                    nickname=user_data['nickname'],
                    school=user_data['school'],
                    major=user_data['major'],
                    grade=user_data['grade'],
                    role=user_data['role']
                )

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def create(self, username: str, phone: str, password: str, nickname: str = '',
               school: str = '', major: str = '', grade: str = '', role: str = ROLE_BUYER) -> int:
        salt = secrets.token_hex(8)
        password_hash = self._hash_password(password, salt)
        now = datetime.now().isoformat()
        data = {
            'username': username,
            'phone': phone,
            'password_hash': password_hash,
            'salt': salt,
            'nickname': nickname or f'用户{phone[-4:]}',
            'avatar': '',
            'school': school,
            'major': major,
            'grade': grade,
            'role': role,
            'credit': 100,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def verify_password(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_username(username)
        if not user:
            user = self.get_by_phone(username)
        if not user:
            return None

        salt = user.get('salt', '')
        password_hash = self._hash_password(password, salt)

        if password_hash == user.get('password_hash'):
            return {
                'id': user.get('id'),
                'username': user.get('username'),
                'phone': user.get('phone'),
                'nickname': user.get('nickname'),
                'school': user.get('school'),
                'major': user.get('major'),
                'grade': user.get('grade'),
                'role': user.get('role'),
                'credit': user.get('credit'),
                'avatar': user.get('avatar'),
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
            'nickname', 'avatar', 'school', 'major', 'grade', 'role'
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

    def update_credit(self, user_id: int, delta: int) -> int:
        user = self.get_by_id(user_id)
        if not user:
            return 0

        current_credit = user.get('credit', 100)
        new_credit = max(0, min(100, current_credit + delta))

        now = datetime.now().isoformat()
        data = {
            'credit': new_credit,
            'updated_at': now
        }
        return self.exec.update_by_id(user_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                school: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if school:
            conditions['school'] = school

        if keyword:
            return self.search(keyword, page, page_size, status, school)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, school: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if school:
            where_clauses.append("school = ?")
            params.append(school)

        where_clauses.append("(username LIKE ? OR phone LIKE ? OR nickname LIKE ? OR school LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

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
            self.STATUS_MUTED: '禁言',
            self.STATUS_BANNED: '封号'
        }
        return status_map.get(status, '未知')

    def get_role_text(self, role: str) -> str:
        role_map = {
            self.ROLE_BUYER: '买家',
            self.ROLE_SELLER: '卖家',
            self.ROLE_BOTH: '买家/卖家'
        }
        return role_map.get(role, '未知')

    def to_public_dict(self, user: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'phone': user.get('phone'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'school': user.get('school'),
            'major': user.get('major'),
            'grade': user.get('grade'),
            'role': user.get('role'),
            'role_text': self.get_role_text(user.get('role')),
            'credit': user.get('credit'),
            'status': user.get('status'),
            'status_text': self.get_status_text(user.get('status')),
            'created_at': user.get('created_at')
        }
