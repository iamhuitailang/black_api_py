from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CatModel:
    TABLE_NAME = 'tb_maomi_model_cat'

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
                breed TEXT NOT NULL,
                color TEXT NOT NULL,
                personality TEXT NOT NULL,
                favorite_food TEXT DEFAULT '',
                favorite_toy TEXT DEFAULT '',
                age INTEGER DEFAULT 1,
                mood INTEGER DEFAULT 80,
                energy INTEGER DEFAULT 100,
                hunger INTEGER DEFAULT 100,
                cleanliness INTEGER DEFAULT 100,
                cuteness INTEGER DEFAULT 50,
                image TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                is_visitor INTEGER DEFAULT 0,
                visitor_owner TEXT DEFAULT '',
                unlock_level INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, breed: str, color: str, personality: str,
               favorite_food: str = '', favorite_toy: str = '', age: int = 1,
               cuteness: int = 50, image: str = '', is_visitor: int = 0,
               visitor_owner: str = '', unlock_level: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'breed': breed,
            'color': color,
            'personality': personality,
            'favorite_food': favorite_food,
            'favorite_toy': favorite_toy,
            'age': age,
            'mood': 80,
            'energy': 100,
            'hunger': 100,
            'cleanliness': 100,
            'cuteness': cuteness,
            'image': image,
            'status': 'active',
            'is_visitor': is_visitor,
            'visitor_owner': visitor_owner,
            'unlock_level': unlock_level,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, include_visitors: bool = False) -> List[Dict[str, Any]]:
        if include_visitors:
            return self.query.find_all({'user_id': user_id}, order_by='cuteness DESC, id ASC')
        return self.query.find_all({'user_id': user_id, 'is_visitor': 0}, order_by='cuteness DESC, id ASC')

    def get_all_active(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 'active', 'is_visitor': 0},
                                    order_by='cuteness DESC, id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def update_status(self, record_id: int, status: str) -> int:
        return self.update(record_id, status=status)

    def update_mood(self, record_id: int, delta: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        new_mood = max(0, min(100, cat.get('mood', 0) + delta))
        return self.update(record_id, mood=new_mood)

    def update_energy(self, record_id: int, delta: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        new_energy = max(0, min(100, cat.get('energy', 0) + delta))
        return self.update(record_id, energy=new_energy)

    def update_hunger(self, record_id: int, delta: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        new_hunger = max(0, min(100, cat.get('hunger', 0) + delta))
        return self.update(record_id, hunger=new_hunger)

    def feed_cat(self, record_id: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        return self.update(record_id, hunger=100, mood=min(100, cat.get('mood', 0) + 10))

    def play_with_cat(self, record_id: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        return self.update(record_id,
                           mood=min(100, cat.get('mood', 0) + 15),
                           energy=max(0, cat.get('energy', 0) - 10),
                           hunger=max(0, cat.get('hunger', 0) - 5))

    def clean_cat(self, record_id: int) -> int:
        cat = self.get_by_id(record_id)
        if not cat:
            return 0
        return self.update(record_id, cleanliness=100, mood=min(100, cat.get('mood', 0) + 5))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_visitors(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ? AND is_visitor = 1"
        return self.exec.execute_raw(sql, (user_id,))

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def count(self) -> int:
        return self.query.count()

    def count_by_user(self, user_id: int) -> int:
        return self.query.count(conditions={'user_id': user_id, 'is_visitor': 0})
