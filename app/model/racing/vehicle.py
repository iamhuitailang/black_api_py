from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VehicleModel:
    TABLE_NAME = 'tb_racing_vehicle'

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
                engine_power INTEGER NOT NULL DEFAULT 50,
                suspension_hardness INTEGER NOT NULL DEFAULT 3,
                tire_grip INTEGER NOT NULL DEFAULT 4,
                weight INTEGER NOT NULL DEFAULT 1200,
                tire_wear INTEGER NOT NULL DEFAULT 0,
                tire_type TEXT NOT NULL DEFAULT 'normal',
                gold INTEGER NOT NULL DEFAULT 0,
                current_track INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    def create(self, player_name: str = 'Player') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'engine_power': 50,
            'suspension_hardness': 3,
            'tire_grip': 4,
            'weight': 1200,
            'tire_wear': 0,
            'tire_type': 'normal',
            'gold': 0,
            'current_track': 0,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_active(self) -> Optional[Dict[str, Any]]:
        results = self.query.find_all(conditions={'is_active': 1}, limit=1)
        return results[0] if results else None

    def get_by_id(self, vehicle_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(vehicle_id)

    def update(self, vehicle_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(vehicle_id, kwargs)

    def deactivate_all(self) -> int:
        return self.exec.update({'is_active': 0, 'updated_at': datetime.now().isoformat()},
                                conditions={'is_active': 1})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')
