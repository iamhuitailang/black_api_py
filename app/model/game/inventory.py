from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class InventoryModel:
    TABLE_NAME = 'tb_game_inventory'

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
                save_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                item_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                is_equipped INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, item_type: str, item_id: int,
               quantity: int = 1, is_equipped: int = 0) -> int:
        now = datetime.now().isoformat()
        existing = self.query.find_one({
            'save_id': save_id,
            'item_type': item_type,
            'item_id': item_id
        })
        if existing:
            new_qty = existing['quantity'] + quantity
            return self.exec.update_by_id(existing['id'], {
                'quantity': new_qty,
                'updated_at': now
            })
        data = {
            'save_id': save_id,
            'item_type': item_type,
            'item_id': item_id,
            'quantity': quantity,
            'is_equipped': is_equipped,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='item_type ASC, id ASC')

    def get_equipment(self, save_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT inv.*, eq.name, eq.description, eq.slot_type, eq.rarity, eq.tier,
                   eq.attack_bonus, eq.defense_bonus, eq.shield_bonus, eq.hull_bonus,
                   eq.shield_regen_bonus, eq.evasion_bonus, eq.special_effect
            FROM {self.TABLE_NAME} inv
            JOIN tb_game_equipment eq ON inv.item_id = eq.id
            WHERE inv.save_id = ? AND inv.item_type = 'equipment'
            ORDER BY eq.slot_type ASC, eq.tier ASC
        """
        return self.db.fetch_all(sql, (save_id,))

    def get_items(self, save_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT inv.*, it.name, it.description, it.item_type as cat_type, it.rarity,
                   it.heal_hull, it.heal_shield, it.damage_bonus, it.defense_bonus, it.special_effect
            FROM {self.TABLE_NAME} inv
            JOIN tb_game_item it ON inv.item_id = it.id
            WHERE inv.save_id = ? AND inv.item_type = 'item'
            ORDER BY it.item_type ASC, it.price ASC
        """
        return self.db.fetch_all(sql, (save_id,))

    def update_quantity(self, record_id: int, quantity: int) -> int:
        now = datetime.now().isoformat()
        if quantity <= 0:
            return self.exec.delete_by_id(record_id)
        return self.exec.update_by_id(record_id, {'quantity': quantity, 'updated_at': now})

    def set_equipped(self, record_id: int, is_equipped: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'is_equipped': is_equipped, 'updated_at': now})

    def unequip_slot(self, save_id: int, slot_type: str) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} SET is_equipped = 0, updated_at = ?
            WHERE save_id = ? AND item_type = 'equipment' AND is_equipped = 1
            AND item_id IN (SELECT id FROM tb_game_equipment WHERE slot_type = ?)
        """
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now, save_id, slot_type))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
