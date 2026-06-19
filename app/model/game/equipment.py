from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EquipmentModel:
    TABLE_NAME = 'tb_game_equipment'

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
                slot_type TEXT NOT NULL,
                rarity TEXT NOT NULL DEFAULT 'common',
                tier INTEGER NOT NULL DEFAULT 1,
                price INTEGER NOT NULL DEFAULT 100,
                attack_bonus INTEGER NOT NULL DEFAULT 0,
                defense_bonus INTEGER NOT NULL DEFAULT 0,
                shield_bonus INTEGER NOT NULL DEFAULT 0,
                hull_bonus INTEGER NOT NULL DEFAULT 0,
                shield_regen_bonus INTEGER NOT NULL DEFAULT 0,
                evasion_bonus INTEGER NOT NULL DEFAULT 0,
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
            {'name': '破旧激光炮', 'description': '从废品堆里捡的，还能用。', 'slot_type': 'weapon', 'rarity': 'common', 'tier': 1,
             'price': 200, 'attack_bonus': 5},
            {'name': '脉冲加农炮', 'description': '标准联邦制式武器，稳定可靠。', 'slot_type': 'weapon', 'rarity': 'uncommon', 'tier': 2,
             'price': 800, 'attack_bonus': 12},
            {'name': '等离子撕裂者', 'description': '海盗改装武器，火力凶狠。', 'slot_type': 'weapon', 'rarity': 'rare', 'tier': 3,
             'price': 2200, 'attack_bonus': 20, 'special_effect': '10%概率灼烧'},
            {'name': '破碎护盾发生器', 'description': '勉强能撑住一下的护盾。', 'slot_type': 'shield', 'rarity': 'common', 'tier': 1,
             'price': 150, 'shield_bonus': 20, 'shield_regen_bonus': 2},
            {'name': 'MK-II能量护盾', 'description': '企业级防护产品。', 'slot_type': 'shield', 'rarity': 'uncommon', 'tier': 2,
             'price': 700, 'shield_bonus': 40, 'shield_regen_bonus': 5},
            {'name': '量子偏导护盾', 'description': '科研站最新研发产品，效果出众。', 'slot_type': 'shield', 'rarity': 'rare', 'tier': 3,
             'price': 2000, 'shield_bonus': 70, 'shield_regen_bonus': 8, 'defense_bonus': 3},
            {'name': '生锈的装甲板', 'description': '旧船拆下来的装甲。', 'slot_type': 'hull', 'rarity': 'common', 'tier': 1,
             'price': 180, 'hull_bonus': 25, 'defense_bonus': 2},
            {'name': '复合装甲层', 'description': '多层合金复合装甲。', 'slot_type': 'hull', 'rarity': 'uncommon', 'tier': 2,
             'price': 750, 'hull_bonus': 50, 'defense_bonus': 5},
            {'name': '战舰级加固船体', 'description': '原主力舰的船体装甲。', 'slot_type': 'hull', 'rarity': 'rare', 'tier': 3,
             'price': 2100, 'hull_bonus': 90, 'defense_bonus': 10},
            {'name': '老旧推进器', 'description': '老型号的推进器。', 'slot_type': 'engine', 'rarity': 'common', 'tier': 1,
             'price': 120, 'evasion_bonus': 3},
            {'name': '离子引擎', 'description': '高效离子推进系统。', 'slot_type': 'engine', 'rarity': 'uncommon', 'tier': 2,
             'price': 650, 'evasion_bonus': 8},
            {'name': '曲率跃迁引擎', 'description': '稀有科技，机动性极佳。', 'slot_type': 'engine', 'rarity': 'rare', 'tier': 3,
             'price': 1900, 'evasion_bonus': 15, 'shield_regen_bonus': 2},
        ]
        for item in items:
            model.create(**item)

    def create(self, name: str, description: str = '', slot_type: str = 'weapon',
               rarity: str = 'common', tier: int = 1, price: int = 100,
               attack_bonus: int = 0, defense_bonus: int = 0, shield_bonus: int = 0,
               hull_bonus: int = 0, shield_regen_bonus: int = 0, evasion_bonus: int = 0,
               special_effect: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'slot_type': slot_type,
            'rarity': rarity,
            'tier': tier,
            'price': price,
            'attack_bonus': attack_bonus,
            'defense_bonus': defense_bonus,
            'shield_bonus': shield_bonus,
            'hull_bonus': hull_bonus,
            'shield_regen_bonus': shield_regen_bonus,
            'evasion_bonus': evasion_bonus,
            'special_effect': special_effect,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='slot_type ASC, tier ASC, price ASC')

    def get_by_slot(self, slot_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'slot_type': slot_type}, order_by='tier ASC, price ASC')

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
