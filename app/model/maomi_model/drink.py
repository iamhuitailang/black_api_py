from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DrinkModel:
    TABLE_NAME = 'tb_maomi_model_drink'

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
                type TEXT NOT NULL,
                price INTEGER NOT NULL,
                cost INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                popularity INTEGER DEFAULT 50,
                stock INTEGER DEFAULT 100,
                is_available INTEGER DEFAULT 1,
                preparation_time INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, type: str, price: int, cost: int = 0,
               description: str = '', image: str = '', preparation_time: int = 5) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'type': type,
            'price': price,
            'cost': cost,
            'description': description,
            'image': image,
            'popularity': 50,
            'stock': 100,
            'is_available': 1,
            'preparation_time': preparation_time,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='type ASC, popularity DESC, id ASC')

    def get_available(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_available': 1},
                                    order_by='type ASC, popularity DESC, id ASC')

    def get_by_type(self, user_id: int, type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'type': type, 'is_available': 1},
                                    order_by='popularity DESC, id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def update_stock(self, record_id: int, delta: int) -> int:
        drink = self.get_by_id(record_id)
        if not drink:
            return 0
        new_stock = max(0, drink.get('stock', 0) + delta)
        return self.update(record_id, stock=new_stock)

    def update_popularity(self, record_id: int, delta: int) -> int:
        drink = self.get_by_id(record_id)
        if not drink:
            return 0
        new_popularity = max(0, min(100, drink.get('popularity', 50) + delta))
        return self.update(record_id, popularity=new_popularity)

    def toggle_available(self, record_id: int) -> Optional[Dict[str, Any]]:
        drink = self.get_by_id(record_id)
        if not drink:
            return None
        new_status = 0 if drink.get('is_available', 1) == 1 else 1
        self.update(record_id, is_available=new_status)
        return self.get_by_id(record_id)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def count(self) -> int:
        return self.query.count()

    def create_default_drinks(self, user_id: int) -> int:
        default_drinks = [
            {'name': '美式咖啡', 'type': 'drink', 'price': 28, 'cost': 8, 'description': '经典美式，香醇浓郁', 'preparation_time': 3},
            {'name': '拿铁', 'type': 'drink', 'price': 32, 'cost': 10, 'description': '丝滑奶香与咖啡的完美结合', 'preparation_time': 5},
            {'name': '卡布奇诺', 'type': 'drink', 'price': 35, 'cost': 12, 'description': '绵密奶泡，咖啡香浓', 'preparation_time': 5},
            {'name': '猫爪拿铁', 'type': 'drink', 'price': 42, 'cost': 15, 'description': '可爱猫爪拉花，店内招牌', 'preparation_time': 8},
            {'name': '草莓蛋糕', 'type': 'dessert', 'price': 38, 'cost': 15, 'description': '新鲜草莓搭配奶油蛋糕', 'preparation_time': 2},
            {'name': '提拉米苏', 'type': 'dessert', 'price': 45, 'cost': 18, 'description': '意式经典，入口即化', 'preparation_time': 2},
            {'name': '猫爪布丁', 'type': 'dessert', 'price': 28, 'cost': 10, 'description': '可爱猫爪形状的焦糖布丁', 'preparation_time': 2},
            {'name': '抹茶慕斯', 'type': 'dessert', 'price': 42, 'cost': 16, 'description': '清新抹茶，口感绵密', 'preparation_time': 2},
        ]
        count = 0
        for drink in default_drinks:
            self.create(user_id=user_id, **drink)
            count += 1
        return count
