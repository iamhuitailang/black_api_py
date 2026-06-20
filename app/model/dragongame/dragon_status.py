from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DragonStatusModel:
    TABLE_NAME = 'dragon_status'

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
                player_name TEXT NOT NULL DEFAULT 'Player',
                record_id INTEGER NOT NULL DEFAULT 0,
                flame_level INTEGER NOT NULL DEFAULT 1,
                flame_damage_multiplier REAL NOT NULL DEFAULT 1.0,
                essence_collected INTEGER NOT NULL DEFAULT 0,
                total_essence INTEGER NOT NULL DEFAULT 0,
                max_hp INTEGER NOT NULL DEFAULT 150,
                charge_damage INTEGER NOT NULL DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_record_id ON {cls.TABLE_NAME}(record_id)"
        db.execute(index_sql2)

    def create(self, player_name: str = 'Player', record_id: int = 0,
               flame_level: int = 1, flame_damage_multiplier: float = 1.0,
               essence_collected: int = 0, total_essence: int = 0,
               max_hp: int = 150, charge_damage: int = 30) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'record_id': record_id,
            'flame_level': flame_level,
            'flame_damage_multiplier': flame_damage_multiplier,
            'essence_collected': essence_collected,
            'total_essence': total_essence,
            'max_hp': max_hp,
            'charge_damage': charge_damage,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, status_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(status_id)

    def get_by_record(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(where={'record_id': record_id}, order_by='id DESC')

    def get_by_player(self, player_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all(where={'player_name': player_name}, order_by='id DESC', limit=10)

    def get_latest(self, player_name: str = None) -> Optional[Dict[str, Any]]:
        if player_name:
            return self.query.find_one(where={'player_name': player_name}, order_by='id DESC')
        return self.query.find_one(order_by='id DESC')

    def update(self, status_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(status_id, data)

    def upgrade_flame(self, status_id: int, essence_cost: int = 1) -> Optional[Dict[str, Any]]:
        current = self.get_by_id(status_id)
        if not current:
            return None

        new_level = current['flame_level'] + 1
        new_multiplier = round(1.0 + (new_level - 1) * 0.15, 4)
        new_essence = current['essence_collected'] - essence_cost
        if new_essence < 0:
            return None

        self.update(status_id,
                    flame_level=new_level,
                    flame_damage_multiplier=new_multiplier,
                    essence_collected=new_essence)

        return self.get_by_id(status_id)

    def collect_essence(self, status_id: int, amount: int = 1) -> Optional[Dict[str, Any]]:
        current = self.get_by_id(status_id)
        if not current:
            return None

        new_essence = current['essence_collected'] + amount
        new_total = current['total_essence'] + amount

        self.update(status_id,
                    essence_collected=new_essence,
                    total_essence=new_total)

        return self.get_by_id(status_id)

    def delete(self, status_id: int) -> int:
        return self.exec.delete_by_id(status_id)

    def count(self) -> int:
        return self.query.count()
