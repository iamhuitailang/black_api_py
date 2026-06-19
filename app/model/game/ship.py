from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ShipModel:
    TABLE_NAME = 'tb_game_ship'

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
                name TEXT NOT NULL DEFAULT '破船号',
                model TEXT NOT NULL DEFAULT 'scavenger',
                max_hull INTEGER NOT NULL DEFAULT 100,
                current_hull INTEGER NOT NULL DEFAULT 100,
                max_shield INTEGER NOT NULL DEFAULT 50,
                current_shield INTEGER NOT NULL DEFAULT 50,
                shield_regen INTEGER NOT NULL DEFAULT 5,
                base_attack INTEGER NOT NULL DEFAULT 15,
                base_defense INTEGER NOT NULL DEFAULT 5,
                evasion INTEGER NOT NULL DEFAULT 10,
                weapon_slot_id INTEGER,
                shield_slot_id INTEGER,
                engine_slot_id INTEGER,
                hull_slot_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, save_id: int, name: str = '破船号', model: str = 'scavenger',
               max_hull: int = 100, current_hull: int = 100,
               max_shield: int = 50, current_shield: int = 50,
               shield_regen: int = 5, base_attack: int = 15,
               base_defense: int = 5, evasion: int = 10,
               weapon_slot_id: int = None, shield_slot_id: int = None,
               engine_slot_id: int = None, hull_slot_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'name': name,
            'model': model,
            'max_hull': max_hull,
            'current_hull': current_hull,
            'max_shield': max_shield,
            'current_shield': current_shield,
            'shield_regen': shield_regen,
            'base_attack': base_attack,
            'base_defense': base_defense,
            'evasion': evasion,
            'weapon_slot_id': weapon_slot_id,
            'shield_slot_id': shield_slot_id,
            'engine_slot_id': engine_slot_id,
            'hull_slot_id': hull_slot_id,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'save_id': save_id})

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
