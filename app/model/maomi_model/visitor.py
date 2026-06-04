from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class VisitorModel:
    TABLE_NAME = 'tb_maomi_model_visitor'

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
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT DEFAULT '',
                personality TEXT DEFAULT '',
                preferences TEXT DEFAULT '',
                cat_breed TEXT DEFAULT '',
                cat_name TEXT DEFAULT '',
                cat_avatar TEXT DEFAULT '',
                cat_personality TEXT DEFAULT '',
                stay_minutes INTEGER DEFAULT 30,
                tip_multiplier REAL DEFAULT 1.0,
                is_active INTEGER DEFAULT 1,
                arrived_at TIMESTAMP DEFAULT '',
                left_at TIMESTAMP DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, avatar: str = '', personality: str = '',
               preferences: str = '', cat_breed: str = '', cat_name: str = '',
               cat_avatar: str = '', cat_personality: str = '',
               stay_minutes: int = 30, tip_multiplier: float = 1.0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'avatar': avatar,
            'personality': personality,
            'preferences': preferences,
            'cat_breed': cat_breed,
            'cat_name': cat_name,
            'cat_avatar': cat_avatar,
            'cat_personality': cat_personality,
            'stay_minutes': stay_minutes,
            'tip_multiplier': tip_multiplier,
            'is_active': 1,
            'arrived_at': now,
            'left_at': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_active': 1},
                                    order_by='arrived_at ASC')

    def get_by_user_id(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id},
                                    order_by='created_at DESC',
                                    limit=limit)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def visitor_leave(self, record_id: int) -> Optional[Dict[str, Any]]:
        visitor = self.get_by_id(record_id)
        if not visitor:
            return None
        now = datetime.now().isoformat()
        self.update(record_id, is_active=0, left_at=now)
        return self.get_by_id(record_id)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def clear_active(self, user_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_active = 0, left_at = ? WHERE user_id = ? AND is_active = 1"
        now = datetime.now().isoformat()
        return self.exec.execute_raw(sql, (now, user_id))

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def count(self) -> int:
        return self.query.count()

    def count_active(self, user_id: int) -> int:
        return self.query.count(conditions={'user_id': user_id, 'is_active': 1})

    def generate_random_visitor(self, user_id: int, bring_cat: bool = False) -> Optional[Dict[str, Any]]:
        names = ['小明', '小红', '阿强', '美美', '大叔', '阿姨', '学生', '上班族', '艺术家', '程序员']
        personalities = ['开朗', '温柔', '腼腆', '活泼', '安静', '热情', '高冷', '呆萌']
        preferences = ['喜欢安静', '爱拍照', '喜欢撸猫', '只想喝咖啡', '想看可爱猫咪']
        cat_breeds = ['英短', '美短', '布偶', '橘猫', '暹罗', '波斯', '缅因', '田园猫']
        cat_names = ['咪咪', '小白', '豆豆', '花花', '团子', '奶茶', '布丁', '芝麻']
        cat_personalities = ['黏人', '独立', '调皮', '懒癌', '傲娇', '胆小']

        name = random.choice(names)
        personality = random.choice(personalities)
        preference = random.choice(preferences)
        tip_multiplier = round(random.uniform(0.8, 2.0), 1)
        stay_minutes = random.randint(15, 60)

        cat_breed = ''
        cat_name = ''
        cat_personality = ''
        if bring_cat:
            cat_breed = random.choice(cat_breeds)
            cat_name = random.choice(cat_names)
            cat_personality = random.choice(cat_personalities)
            tip_multiplier = round(tip_multiplier * 1.5, 1)

        visitor_id = self.create(
            user_id=user_id,
            name=name,
            personality=personality,
            preferences=preference,
            cat_breed=cat_breed,
            cat_name=cat_name,
            cat_personality=cat_personality,
            stay_minutes=stay_minutes,
            tip_multiplier=tip_multiplier
        )

        return self.get_by_id(visitor_id)
