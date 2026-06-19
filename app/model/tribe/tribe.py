from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TribeModel:
    TABLE_NAME = 'tb_tribe'

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
                name TEXT NOT NULL DEFAULT '未命名部落',
                era TEXT NOT NULL DEFAULT 'stone',
                turn INTEGER NOT NULL DEFAULT 1,
                season TEXT NOT NULL DEFAULT 'spring',
                year INTEGER NOT NULL DEFAULT 1,
                food INTEGER NOT NULL DEFAULT 50,
                wood INTEGER NOT NULL DEFAULT 30,
                stone INTEGER NOT NULL DEFAULT 20,
                metal INTEGER NOT NULL DEFAULT 0,
                knowledge INTEGER NOT NULL DEFAULT 0,
                population INTEGER NOT NULL DEFAULT 5,
                max_population INTEGER NOT NULL DEFAULT 10,
                morale INTEGER NOT NULL DEFAULT 70,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, name: str = '未命名部落') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def advance_turn(self, record_id: int, season: str, year: int, turn: int,
                     food: int, wood: int, stone: int, metal: int, knowledge: int,
                     population: int, max_population: int, morale: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'season': season,
            'year': year,
            'turn': turn,
            'food': food,
            'wood': wood,
            'stone': stone,
            'metal': metal,
            'knowledge': knowledge,
            'population': population,
            'max_population': max_population,
            'morale': morale,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_era(self, record_id: int, era: str) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'era': era, 'updated_at': now})
