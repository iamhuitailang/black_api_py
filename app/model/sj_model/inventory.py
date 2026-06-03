from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SjInventoryModel:
    TABLE_NAME = 'tb_sj_model_inventory'

    TYPE_WEAPON = 'weapon'
    TYPE_ARMOR = 'armor'
    TYPE_ACCESSORY = 'accessory'
    TYPE_CONSUMABLE = 'consumable'
    TYPE_MATERIAL = 'material'

    RARITY_COMMON = 0
    RARITY_UNCOMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

    RARITY_NAMES = {
        RARITY_COMMON: '普通',
        RARITY_UNCOMMON: '优秀',
        RARITY_RARE: '稀有',
        RARITY_EPIC: '史诗',
        RARITY_LEGENDARY: '传说'
    }

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
                character_id INTEGER NOT NULL,
                item_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                item_type TEXT NOT NULL,
                rarity INTEGER DEFAULT 0,
                attack_bonus INTEGER DEFAULT 0,
                defense_bonus INTEGER DEFAULT 0,
                hp_bonus INTEGER DEFAULT 0,
                mp_bonus INTEGER DEFAULT 0,
                speed_bonus INTEGER DEFAULT 0,
                special_effect TEXT DEFAULT '',
                equipped INTEGER DEFAULT 0,
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_type ON {cls.TABLE_NAME}(item_type)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_equipped ON {cls.TABLE_NAME}(equipped)"
        db.execute(index_sql3)

    def create(self, character_id: int, item_id: str, item_name: str,
               item_type: str, rarity: int = 0, attack_bonus: int = 0,
               defense_bonus: int = 0, hp_bonus: int = 0, mp_bonus: int = 0,
               speed_bonus: int = 0, special_effect: str = '', quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'character_id': character_id,
            'item_id': item_id,
            'item_name': item_name,
            'item_type': item_type,
            'rarity': rarity,
            'attack_bonus': attack_bonus,
            'defense_bonus': defense_bonus,
            'hp_bonus': hp_bonus,
            'mp_bonus': mp_bonus,
            'speed_bonus': speed_bonus,
            'special_effect': special_effect,
            'equipped': 0,
            'quantity': quantity,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_character(self, character_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'character_id': character_id}, order_by='rarity DESC, id ASC')

    def get_equipped(self, character_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'character_id': character_id, 'equipped': 1})

    def update_equipped(self, inventory_id: int, equipped: int) -> int:
        return self.exec.update_by_id(inventory_id, {'equipped': equipped})

    def update_quantity(self, inventory_id: int, quantity: int) -> int:
        if quantity <= 0:
            return self.exec.delete_by_id(inventory_id)
        return self.exec.update_by_id(inventory_id, {'quantity': quantity})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_character(self, character_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE character_id = ?",
            (character_id,)
        )

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'character_id': item.get('character_id'),
            'item_id': item.get('item_id'),
            'item_name': item.get('item_name'),
            'item_type': item.get('item_type'),
            'rarity': item.get('rarity'),
            'rarity_name': self.RARITY_NAMES.get(item.get('rarity', 0), '普通'),
            'attack_bonus': item.get('attack_bonus'),
            'defense_bonus': item.get('defense_bonus'),
            'hp_bonus': item.get('hp_bonus'),
            'mp_bonus': item.get('mp_bonus'),
            'speed_bonus': item.get('speed_bonus'),
            'special_effect': item.get('special_effect'),
            'equipped': item.get('equipped'),
            'quantity': item.get('quantity'),
            'created_at': item.get('created_at')
        }
