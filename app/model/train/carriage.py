from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CarriageModel:
    TABLE_NAME = 'train_carriage'

    CARRIAGE_TYPES = {
        'cockpit': {'name': '驾驶舱', 'max_hp': 200, 'upgrade_benefit': 'speed'},
        'cargo': {'name': '货舱', 'max_hp': 100, 'upgrade_benefit': 'capacity'},
        'weapon': {'name': '武器舱', 'max_hp': 80, 'upgrade_benefit': 'damage'},
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
                game_state_id INTEGER NOT NULL,
                carriage_type TEXT NOT NULL,
                name TEXT NOT NULL,
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                attack_power INTEGER DEFAULT 10,
                cargo_capacity INTEGER DEFAULT 50,
                speed_bonus INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_state_id ON {cls.TABLE_NAME}(game_state_id)"
        db.execute(index_sql)

    def create_initial_carriages(self, game_state_id: int) -> List[int]:
        now = datetime.now().isoformat()
        ids = []
        for ctype, config in self.CARRIAGE_TYPES.items():
            data = {
                'game_state_id': game_state_id,
                'carriage_type': ctype,
                'name': config['name'],
                'hp': config['max_hp'],
                'max_hp': config['max_hp'],
                'level': 1,
                'attack_power': 20 if ctype == 'weapon' else 0,
                'cargo_capacity': 50 if ctype == 'cargo' else 0,
                'speed_bonus': 5 if ctype == 'cockpit' else 0,
                'created_at': now,
                'updated_at': now
            }
            ids.append(self.exec.insert(data))
        return ids

    def get_by_game_state(self, game_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_state_id': game_state_id}, order_by='id ASC')

    def get_by_type(self, game_state_id: int, carriage_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_state_id': game_state_id, 'carriage_type': carriage_type})

    def update_carriage(self, carriage_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(carriage_id, data)

    def upgrade_carriage(self, carriage_id: int) -> int:
        carriage = self.query.find_by_id(carriage_id)
        if not carriage:
            return 0
        
        new_level = carriage['level'] + 1
        hp_increase = 20
        attack_increase = 5 if carriage['carriage_type'] == 'weapon' else 0
        cargo_increase = 20 if carriage['carriage_type'] == 'cargo' else 0
        speed_increase = 2 if carriage['carriage_type'] == 'cockpit' else 0

        data = {
            'level': new_level,
            'max_hp': carriage['max_hp'] + hp_increase,
            'hp': carriage['hp'] + hp_increase,
            'attack_power': carriage['attack_power'] + attack_increase,
            'cargo_capacity': carriage['cargo_capacity'] + cargo_increase,
            'speed_bonus': carriage['speed_bonus'] + speed_increase,
        }
        return self.update_carriage(carriage_id, data)

    def damage_carriage(self, carriage_id: int, damage: int) -> int:
        carriage = self.query.find_by_id(carriage_id)
        if not carriage:
            return 0
        new_hp = max(0, carriage['hp'] - damage)
        return self.update_carriage(carriage_id, {'hp': new_hp})

    def repair_carriage(self, carriage_id: int, amount: int) -> int:
        carriage = self.query.find_by_id(carriage_id)
        if not carriage:
            return 0
        new_hp = min(carriage['max_hp'], carriage['hp'] + amount)
        return self.update_carriage(carriage_id, {'hp': new_hp})
