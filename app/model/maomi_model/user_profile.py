from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserProfileModel:
    TABLE_NAME = 'tb_maomi_model_user_profile'

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
                nickname TEXT DEFAULT '猫咪店长',
                avatar TEXT DEFAULT '',
                coins INTEGER DEFAULT 1000,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                reputation INTEGER DEFAULT 0,
                cafe_name TEXT DEFAULT '温馨猫咪咖啡馆',
                total_customers INTEGER DEFAULT 0,
                total_income INTEGER DEFAULT 0,
                play_days INTEGER DEFAULT 1,
                last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, nickname: str = '猫咪店长') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'nickname': nickname,
            'coins': 1000,
            'level': 1,
            'experience': 0,
            'reputation': 0,
            'cafe_name': '温馨猫咪咖啡馆',
            'total_customers': 0,
            'total_income': 0,
            'play_days': 1,
            'last_login_time': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def add_coins(self, user_id: int, amount: int) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        new_coins = profile.get('coins', 0) + amount
        return self.update(profile.get('id'), coins=new_coins)

    def add_experience(self, user_id: int, amount: int) -> int:
        profile = self.get_by_user_id(user_id)
        if not profile:
            return 0
        new_exp = profile.get('experience', 0) + amount
        new_level = profile.get('level', 1)
        exp_needed = new_level * 100
        while new_exp >= exp_needed:
            new_exp -= exp_needed
            new_level += 1
            exp_needed = new_level * 100
        return self.update(profile.get('id'), experience=new_exp, level=new_level)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='level DESC, reputation DESC')

    def count(self) -> int:
        return self.query.count()
