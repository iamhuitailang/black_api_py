from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CityStateModel:
    TABLE_NAME = 'city_state'

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
                player_id TEXT NOT NULL,
                food INTEGER DEFAULT 100,
                stone INTEGER DEFAULT 100,
                wood INTEGER DEFAULT 100,
                gold INTEGER DEFAULT 100,
                population INTEGER DEFAULT 0,
                max_population INTEGER DEFAULT 0,
                soldiers INTEGER DEFAULT 0,
                prosperity INTEGER DEFAULT 0,
                defense_power INTEGER DEFAULT 0,
                current_year INTEGER DEFAULT 1,
                current_season TEXT DEFAULT 'spring',
                last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_id ON {cls.TABLE_NAME}(player_id)"
        db.execute(index_sql)

    def create(self, player_id: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_id': player_id,
            'food': 100,
            'stone': 100,
            'wood': 100,
            'gold': 100,
            'population': 0,
            'max_population': 0,
            'soldiers': 0,
            'prosperity': 0,
            'defense_power': 0,
            'current_year': 1,
            'current_season': 'spring',
            'last_update': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_player_id(self, player_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'player_id': player_id})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_resources(self, record_id: int, food: int = None, stone: int = None,
                          wood: int = None, gold: int = None, population: int = None,
                          max_population: int = None, soldiers: int = None,
                          prosperity: int = None, defense_power: int = None,
                          current_year: int = None, current_season: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now, 'last_update': now}
        
        if food is not None:
            data['food'] = food
        if stone is not None:
            data['stone'] = stone
        if wood is not None:
            data['wood'] = wood
        if gold is not None:
            data['gold'] = gold
        if population is not None:
            data['population'] = population
        if max_population is not None:
            data['max_population'] = max_population
        if soldiers is not None:
            data['soldiers'] = soldiers
        if prosperity is not None:
            data['prosperity'] = prosperity
        if defense_power is not None:
            data['defense_power'] = defense_power
        if current_year is not None:
            data['current_year'] = current_year
        if current_season is not None:
            data['current_season'] = current_season
        
        return self.exec.update_by_id(record_id, data)

    def update_last_update(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {'last_update': now, 'updated_at': now}
        return self.exec.update_by_id(record_id, data)
