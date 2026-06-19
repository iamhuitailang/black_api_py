from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_game_item'

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
                description TEXT DEFAULT '',
                item_type TEXT NOT NULL DEFAULT 'consumable',
                rarity TEXT NOT NULL DEFAULT 'common',
                price INTEGER NOT NULL DEFAULT 50,
                heal_hull INTEGER NOT NULL DEFAULT 0,
                heal_shield INTEGER NOT NULL DEFAULT 0,
                damage_bonus INTEGER NOT NULL DEFAULT 0,
                defense_bonus INTEGER NOT NULL DEFAULT 0,
                special_effect TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        items = [
            {'name': '纳米修复包', 'description': '基础船体修复工具。', 'item_type': 'consumable', 'rarity': 'common',
             'price': 80, 'heal_hull': 30},
            {'name': '高级修复剂', 'description': '企业级修复配方。', 'item_type': 'consumable', 'rarity': 'uncommon',
             'price': 250, 'heal_hull': 70},
            {'name': '纳米应急胶囊', 'description': '紧急情况下使用的全功能修复包。', 'item_type': 'consumable', 'rarity': 'rare',
             'price': 600, 'heal_hull': 100, 'heal_shield': 50},
            {'name': '护盾能量电池', 'description': '快速为护盾充能。', 'item_type': 'consumable', 'rarity': 'common',
             'price': 60, 'heal_shield': 40},
            {'name': '过载护盾核心', 'description': '瞬间充满护盾。', 'item_type': 'consumable', 'rarity': 'uncommon',
             'price': 200, 'heal_shield': 100},
            {'name': '火力增幅芯片', 'description': '战斗中临时提升攻击力。', 'item_type': 'battle', 'rarity': 'uncommon',
             'price': 180, 'damage_bonus': 10, 'special_effect': '持续3回合'},
            {'name': '紧急偏导装置', 'description': '临时加强防御。', 'item_type': 'battle', 'rarity': 'uncommon',
             'price': 160, 'defense_bonus': 8, 'special_effect': '持续3回合'},
            {'name': 'EMP手雷', 'description': '使敌方瘫痪一回合。', 'item_type': 'battle', 'rarity': 'rare',
             'price': 450, 'special_effect': '使敌方眩晕1回合'},
        ]
        for item in items:
            model.create(**item)

    def create(self, name: str, description: str = '', item_type: str = 'consumable',
               rarity: str = 'common', price: int = 50, heal_hull: int = 0,
               heal_shield: int = 0, damage_bonus: int = 0, defense_bonus: int = 0,
               special_effect: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'item_type': item_type,
            'rarity': rarity,
            'price': price,
            'heal_hull': heal_hull,
            'heal_shield': heal_shield,
            'damage_bonus': damage_bonus,
            'defense_bonus': defense_bonus,
            'special_effect': special_effect,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='item_type ASC, price ASC')

    def get_by_type(self, item_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'item_type': item_type}, order_by='price ASC')

    def update(self, record_id: int, **kwargs) -> int:
        data = {}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        if not data:
            return 0
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
