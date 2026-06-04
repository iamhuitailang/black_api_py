from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CafeModel:
    TABLE_NAME = 'tb_maomi_model_cafe'

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
                name TEXT DEFAULT '温馨猫咪咖啡馆',
                level INTEGER DEFAULT 1,
                rating REAL DEFAULT 5.0,
                max_customers INTEGER DEFAULT 10,
                current_customers INTEGER DEFAULT 0,
                cleanliness INTEGER DEFAULT 100,
                atmosphere INTEGER DEFAULT 50,
                decoration_level INTEGER DEFAULT 1,
                open_time TEXT DEFAULT '09:00',
                close_time TEXT DEFAULT '22:00',
                is_open INTEGER DEFAULT 1,
                is_raining INTEGER DEFAULT 0,
                current_weather TEXT DEFAULT 'sunny',
                background_image TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str = '温馨猫咪咖啡馆') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'level': 1,
            'rating': 5.0,
            'max_customers': 10,
            'current_customers': 0,
            'cleanliness': 100,
            'atmosphere': 50,
            'decoration_level': 1,
            'open_time': '09:00',
            'close_time': '22:00',
            'is_open': 1,
            'is_raining': 0,
            'current_weather': 'sunny',
            'background_image': '',
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

    def toggle_open(self, user_id: int) -> Optional[Dict[str, Any]]:
        cafe = self.get_by_user_id(user_id)
        if not cafe:
            return None
        new_status = 0 if cafe.get('is_open', 1) == 1 else 1
        self.update(cafe.get('id'), is_open=new_status)
        return self.get_by_user_id(user_id)

    def update_weather(self, user_id: int, weather: str) -> Optional[Dict[str, Any]]:
        cafe = self.get_by_user_id(user_id)
        if not cafe:
            return None
        is_raining = 1 if weather == 'rainy' else 0
        atmosphere_delta = 20 if weather == 'rainy' else 0
        new_atmosphere = min(100, cafe.get('atmosphere', 50) + atmosphere_delta)
        self.update(cafe.get('id'), current_weather=weather, is_raining=is_raining, atmosphere=new_atmosphere)
        return self.get_by_user_id(user_id)

    def add_customer(self, user_id: int) -> Optional[Dict[str, Any]]:
        cafe = self.get_by_user_id(user_id)
        if not cafe:
            return None
        current = cafe.get('current_customers', 0)
        max_cust = cafe.get('max_customers', 10)
        if current >= max_cust:
            return None
        self.update(cafe.get('id'), current_customers=current + 1)
        return self.get_by_user_id(user_id)

    def remove_customer(self, user_id: int) -> Optional[Dict[str, Any]]:
        cafe = self.get_by_user_id(user_id)
        if not cafe:
            return None
        current = max(0, cafe.get('current_customers', 0) - 1)
        self.update(cafe.get('id'), current_customers=current)
        return self.get_by_user_id(user_id)

    def upgrade_cafe(self, user_id: int) -> Optional[Dict[str, Any]]:
        cafe = self.get_by_user_id(user_id)
        if not cafe:
            return None
        new_level = cafe.get('level', 1) + 1
        new_max_customers = cafe.get('max_customers', 10) + 5
        self.update(cafe.get('id'), level=new_level, max_customers=new_max_customers)
        return self.get_by_user_id(user_id)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='level DESC, rating DESC')

    def count(self) -> int:
        return self.query.count()
