from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UpgradeModel:
    TABLE_NAME = 'tb_game_upgrade'

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
                tower_type TEXT NOT NULL,
                level INTEGER NOT NULL,
                cost INTEGER DEFAULT 0,
                damage REAL DEFAULT 0,
                range REAL DEFAULT 0,
                attack_speed REAL DEFAULT 1.0,
                special_value REAL DEFAULT 0,
                UNIQUE(tower_type, level)
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        db = get_db()
        model = cls()
        if model.query.count() > 0:
            return

        data_list = [
            {'tower_type': 'electromagnetic', 'level': 1, 'cost': 0, 'damage': 15, 'range': 120, 'attack_speed': 1.0, 'special_value': 0.5},
            {'tower_type': 'electromagnetic', 'level': 2, 'cost': 80, 'damage': 22, 'range': 135, 'attack_speed': 1.1, 'special_value': 0.55},
            {'tower_type': 'electromagnetic', 'level': 3, 'cost': 160, 'damage': 32, 'range': 150, 'attack_speed': 1.2, 'special_value': 0.6},
            {'tower_type': 'laser', 'level': 1, 'cost': 0, 'damage': 40, 'range': 150, 'attack_speed': 0.7, 'special_value': 0.2},
            {'tower_type': 'laser', 'level': 2, 'cost': 100, 'damage': 60, 'range': 165, 'attack_speed': 0.75, 'special_value': 0.25},
            {'tower_type': 'laser', 'level': 3, 'cost': 200, 'damage': 85, 'range': 180, 'attack_speed': 0.8, 'special_value': 0.3},
            {'tower_type': 'flame', 'level': 1, 'cost': 0, 'damage': 8, 'range': 80, 'attack_speed': 2.0, 'special_value': 3.0},
            {'tower_type': 'flame', 'level': 2, 'cost': 80, 'damage': 12, 'range': 95, 'attack_speed': 2.2, 'special_value': 4.0},
            {'tower_type': 'flame', 'level': 3, 'cost': 160, 'damage': 18, 'range': 110, 'attack_speed': 2.4, 'special_value': 5.0},
            {'tower_type': 'freeze', 'level': 1, 'cost': 0, 'damage': 5, 'range': 130, 'attack_speed': 0.5, 'special_value': 0.7},
            {'tower_type': 'freeze', 'level': 2, 'cost': 120, 'damage': 8, 'range': 145, 'attack_speed': 0.55, 'special_value': 0.75},
            {'tower_type': 'freeze', 'level': 3, 'cost': 240, 'damage': 12, 'range': 160, 'attack_speed': 0.6, 'special_value': 0.8},
        ]
        model.exec.insert_many(data_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='tower_type ASC, level ASC')

    def get_by_tower_type(self, tower_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('tower_type', tower_type, order_by='level ASC')
