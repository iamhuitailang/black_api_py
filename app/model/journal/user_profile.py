from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from datetime import datetime


class UserRole:
    AUTHOR = 'author'
    REVIEWER = 'reviewer'
    EDITOR = 'editor'
    ADMIN = 'admin'

    LABEL_MAP = {
        AUTHOR: '作者',
        REVIEWER: '审稿人',
        EDITOR: '编辑',
        ADMIN: '管理员'
    }


class UserProfileModel:
    TABLE_NAME = 'tb_journal_user_profile'

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
                user_id INTEGER NOT NULL UNIQUE,
                username TEXT DEFAULT '',
                real_name TEXT DEFAULT '',
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                affiliation TEXT DEFAULT '',
                role TEXT DEFAULT 'author',
                research_fields TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_role ON {cls.TABLE_NAME}(role)"
        db.execute(index_sql2)

        now = datetime.now().isoformat()
        default_users = [
            (1, 'admin', '系统管理员', 'admin@journal.com', '13800000000', '编辑部', UserRole.ADMIN, '', now, now),
            (2, 'editor', '张编辑', 'editor@journal.com', '13800000001', '大学学报编辑部', UserRole.EDITOR, '', now, now),
            (3, 'reviewer1', '李教授', 'reviewer1@journal.com', '13800000002', '清华大学计算机系', UserRole.REVIEWER, '人工智能,机器学习', now, now),
            (4, 'reviewer2', '王研究员', 'reviewer2@journal.com', '13800000003', '中科院自动化所', UserRole.REVIEWER, '计算机视觉,模式识别', now, now),
            (5, 'author1', '陈博士', 'author1@journal.com', '13800000004', '北京大学软件学院', UserRole.AUTHOR, '软件工程,分布式系统', now, now),
        ]

        for u in default_users:
            existing = db.fetch_one(
                f"SELECT id FROM {cls.TABLE_NAME} WHERE user_id = ?",
                (u[0],)
            )
            if not existing:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (user_id, username, real_name, email, phone, affiliation, role, research_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    u
                )

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'username': username})

    def create(self, user_id: int, username: str, real_name: str = '',
               email: str = '', phone: str = '', affiliation: str = '',
               role: str = UserRole.AUTHOR, research_fields: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'username': username,
            'real_name': real_name,
            'email': email,
            'phone': phone,
            'affiliation': affiliation,
            'role': role,
            'research_fields': research_fields,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def update(self, user_id: int, real_name: str = None, email: str = None,
               phone: str = None, affiliation: str = None, role: str = None,
               research_fields: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if real_name is not None:
            data['real_name'] = real_name
        if email is not None:
            data['email'] = email
        if phone is not None:
            data['phone'] = phone
        if affiliation is not None:
            data['affiliation'] = affiliation
        if role is not None:
            data['role'] = role
        if research_fields is not None:
            data['research_fields'] = research_fields
        return self.exec.update(data, conditions={'user_id': user_id})

    def get_by_role(self, role: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'role': role},
            order_by='id ASC'
        )

    def get_all_reviewers(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'role': UserRole.REVIEWER},
            order_by='id ASC'
        )

    def get_role(self, user_id: int) -> str:
        profile = self.get_by_user_id(user_id)
        return profile.get('role', UserRole.AUTHOR) if profile else UserRole.AUTHOR

    def has_role(self, user_id: int, role: str) -> bool:
        return self.get_role(user_id) == role

    def is_editor_or_admin(self, user_id: int) -> bool:
        role = self.get_role(user_id)
        return role in [UserRole.EDITOR, UserRole.ADMIN]

    def upsert(self, user_id: int, **kwargs) -> int:
        existing = self.get_by_user_id(user_id)
        if existing:
            return self.update(user_id, **kwargs)
        else:
            return self.create(user_id=user_id, **kwargs)
