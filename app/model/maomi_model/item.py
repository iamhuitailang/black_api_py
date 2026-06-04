from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_maomi_model_item'

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
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                price INTEGER NOT NULL,
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                effect_type TEXT DEFAULT '',
                effect_value INTEGER DEFAULT 0,
                rarity TEXT DEFAULT 'normal',
                is_default INTEGER DEFAULT 0,
                unlock_level INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)

    def create(self, name: str, type: str, category: str, price: int,
               description: str = '', image: str = '', effect_type: str = '',
               effect_value: int = 0, rarity: str = 'normal',
               is_default: int = 0, unlock_level: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'category': category,
            'price': price,
            'description': description,
            'image': image,
            'effect_type': effect_type,
            'effect_value': effect_value,
            'rarity': rarity,
            'is_default': is_default,
            'unlock_level': unlock_level,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='type ASC, rarity DESC, price ASC')

    def get_by_type(self, type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': type}, order_by='rarity DESC, price ASC')

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'category': category}, order_by='rarity DESC, price ASC')

    def get_available_for_level(self, level: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_level <= ? ORDER BY type ASC, rarity DESC, price ASC"
        return self.db.fetch_all(sql, (level,))

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def create_default_items(self) -> int:
        default_items = [
            {'name': '逗猫棒', 'type': 'toy', 'category': 'cat_toy', 'price': 100, 'description': '经典逗猫棒，让猫咪兴奋起来', 'effect_type': 'mood', 'effect_value': 15, 'rarity': 'normal', 'is_default': 1},
            {'name': '毛线球', 'type': 'toy', 'category': 'cat_toy', 'price': 80, 'description': '柔软的毛线球，猫咪的最爱', 'effect_type': 'energy', 'effect_value': 10, 'rarity': 'normal', 'is_default': 1},
            {'name': '猫爬架', 'type': 'toy', 'category': 'cat_toy', 'price': 500, 'description': '多层猫爬架，猫咪可以磨爪和休息', 'effect_type': 'mood', 'effect_value': 25, 'rarity': 'rare', 'is_default': 0, 'unlock_level': 3},
            {'name': '激光笔', 'type': 'toy', 'category': 'cat_toy', 'price': 200, 'description': '有趣的激光笔，猫咪追着跑', 'effect_type': 'mood', 'effect_value': 20, 'rarity': 'normal', 'is_default': 0, 'unlock_level': 2},
            {'name': '猫薄荷', 'type': 'food', 'category': 'cat_food', 'price': 50, 'description': '新鲜猫薄荷，让猫咪开心', 'effect_type': 'mood', 'effect_value': 30, 'rarity': 'normal', 'is_default': 1},
            {'name': '高级猫粮', 'type': 'food', 'category': 'cat_food', 'price': 150, 'description': '营养丰富的高级猫粮', 'effect_type': 'hunger', 'effect_value': 50, 'rarity': 'normal', 'is_default': 0, 'unlock_level': 2},
            {'name': '小鱼干', 'type': 'food', 'category': 'cat_food', 'price': 120, 'description': '美味小鱼干，猫咪的零食', 'effect_type': 'hunger', 'effect_value': 30, 'rarity': 'normal', 'is_default': 1},
            {'name': '温馨地毯', 'type': 'decoration', 'category': 'cafe_deco', 'price': 300, 'description': '柔软的地毯，提升咖啡馆氛围', 'effect_type': 'atmosphere', 'effect_value': 10, 'rarity': 'normal', 'is_default': 0, 'unlock_level': 2},
            {'name': '猫咪挂画', 'type': 'decoration', 'category': 'cafe_deco', 'price': 250, 'description': '可爱的猫咪主题挂画', 'effect_type': 'atmosphere', 'effect_value': 8, 'rarity': 'normal', 'is_default': 0, 'unlock_level': 2},
            {'name': '豪华猫窝', 'type': 'decoration', 'category': 'cafe_deco', 'price': 800, 'description': '豪华的猫窝，猫咪喜欢在里面睡觉', 'effect_type': 'atmosphere', 'effect_value': 20, 'rarity': 'rare', 'is_default': 0, 'unlock_level': 5},
            {'name': '绿植盆栽', 'type': 'decoration', 'category': 'cafe_deco', 'price': 180, 'description': '清新绿植，让空气更清新', 'effect_type': 'atmosphere', 'effect_value': 5, 'rarity': 'normal', 'is_default': 1},
            {'name': '猫爪沙发', 'type': 'furniture', 'category': 'cafe_deco', 'price': 600, 'description': '可爱的猫爪形状沙发', 'effect_type': 'atmosphere', 'effect_value': 15, 'rarity': 'rare', 'is_default': 0, 'unlock_level': 4},
            {'name': '猫薄荷枕头', 'type': 'toy', 'category': 'cat_toy', 'price': 180, 'description': '含有猫薄荷的枕头', 'effect_type': 'mood', 'effect_value': 20, 'rarity': 'normal', 'is_default': 0, 'unlock_level': 2},
        ]
        count = 0
        for item in default_items:
            existing = self.query.find_one({'name': item['name']})
            if not existing:
                self.create(**item)
                count += 1
        return count
