from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaEquipmentModel:
    TABLE_NAME = 'tb_dota_equipment'

    TYPE_ALL = 'all'
    TYPE_STRENGTH = 'strength'

    TYPE_NAMES = {
        TYPE_ALL: '全英雄',
        TYPE_STRENGTH: '力量型'
    }

    DEFAULT_EQUIPMENT = [
        {'id': 1, 'name': '圣剑', 'item_type': TYPE_ALL, 'price': 3000, 'attack_bonus': 50, 'hp_bonus': 0, 'defense_bonus': 0, 'attack_speed_bonus': 0, 'special_effect': '', 'icon': '🗡️', 'description': '攻击力 +50'},
        {'id': 2, 'name': '先锋盾', 'item_type': TYPE_STRENGTH, 'price': 2000, 'attack_bonus': 0, 'hp_bonus': 300, 'defense_bonus': 10, 'attack_speed_bonus': 0, 'special_effect': '', 'icon': '🛡️', 'description': '生命 +300，防御 +10'},
        {'id': 3, 'name': '假腿', 'item_type': TYPE_ALL, 'price': 1000, 'attack_bonus': 10, 'hp_bonus': 0, 'defense_bonus': 0, 'attack_speed_bonus': 20, 'special_effect': '', 'icon': '👢', 'description': '攻速 +20，属性 +10'},
        {'id': 4, 'name': '阿哈利姆神杖', 'item_type': TYPE_ALL, 'price': 4000, 'attack_bonus': 20, 'hp_bonus': 100, 'defense_bonus': 5, 'attack_speed_bonus': 0, 'special_effect': 'ultimate_upgrade', 'icon': '🔮', 'description': '强化大招效果'},
        {'id': 5, 'name': '刷新球', 'item_type': TYPE_ALL, 'price': 5000, 'attack_bonus': 10, 'hp_bonus': 50, 'defense_bonus': 0, 'attack_speed_bonus': 0, 'special_effect': 'reset_cooldown', 'icon': '💍', 'description': '重置所有技能冷却'},
        {'id': 6, 'name': '跳刀', 'item_type': TYPE_ALL, 'price': 1500, 'attack_bonus': 0, 'hp_bonus': 0, 'defense_bonus': 0, 'attack_speed_bonus': 0, 'special_effect': 'first_strike', 'icon': '⚡', 'description': '回合开始有概率先手'},
    ]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                item_type TEXT NOT NULL,
                price INTEGER DEFAULT 0,
                attack_bonus INTEGER DEFAULT 0,
                hp_bonus INTEGER DEFAULT 0,
                defense_bonus INTEGER DEFAULT 0,
                attack_speed_bonus INTEGER DEFAULT 0,
                special_effect TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                description TEXT DEFAULT ''
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_equipment(cls):
        model = DotaEquipmentModel()
        for item in cls.DEFAULT_EQUIPMENT:
            existing = model.get_by_id(item['id'])
            if not existing:
                model.exec.insert(item)

    def get_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(item_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='price ASC')

    def get_available_for_hero(self, hero_type: str) -> List[Dict[str, Any]]:
        all_items = self.get_all()
        return [item for item in all_items if item.get('item_type') == self.TYPE_ALL or item.get('item_type') == hero_type]

    def get_by_special_effect(self, effect: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'special_effect': effect}, order_by='id ASC')

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'item_type': item.get('item_type'),
            'item_type_name': self.TYPE_NAMES.get(item.get('item_type'), '未知'),
            'price': item.get('price'),
            'attack_bonus': item.get('attack_bonus'),
            'hp_bonus': item.get('hp_bonus'),
            'defense_bonus': item.get('defense_bonus'),
            'attack_speed_bonus': item.get('attack_speed_bonus'),
            'special_effect': item.get('special_effect'),
            'icon': item.get('icon'),
            'description': item.get('description')
        }
