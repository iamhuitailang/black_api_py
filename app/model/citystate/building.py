from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BuildingModel:
    TABLE_NAME = 'city_building'
    BUILDING_TYPES = {
        'farm': {'name': '农田', 'cost': {'wood': 30, 'stone': 10}, 'size': 1},
        'barracks': {'name': '兵营', 'cost': {'wood': 50, 'stone': 30, 'gold': 10}, 'size': 2},
        'market': {'name': '市场', 'cost': {'wood': 40, 'stone': 20, 'gold': 20}, 'size': 2},
        'wall': {'name': '城墙', 'cost': {'stone': 50}, 'size': 1},
        'house': {'name': '房屋', 'cost': {'wood': 40, 'stone': 20}, 'size': 1}
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
                city_state_id INTEGER NOT NULL,
                building_type TEXT NOT NULL,
                grid_x INTEGER NOT NULL,
                grid_y INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_state_id ON {cls.TABLE_NAME}(city_state_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_state_type ON {cls.TABLE_NAME}(city_state_id, building_type)"
        db.execute(index_sql)
        db.execute(index_sql2)

    def create(self, city_state_id: int, building_type: str, grid_x: int, grid_y: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_state_id': city_state_id,
            'building_type': building_type,
            'grid_x': grid_x,
            'grid_y': grid_y,
            'level': 1,
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_city_id(self, city_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'city_state_id': city_state_id})

    def get_by_position(self, city_state_id: int, grid_x: int, grid_y: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={
            'city_state_id': city_state_id,
            'grid_x': grid_x,
            'grid_y': grid_y
        })

    def get_by_type(self, city_state_id: int, building_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={
            'city_state_id': city_state_id,
            'building_type': building_type,
            'status': 'active'
        })

    def count_by_type(self, city_state_id: int, building_type: str) -> int:
        return self.query.count(conditions={
            'city_state_id': city_state_id,
            'building_type': building_type,
            'status': 'active'
        })

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {'status': status, 'updated_at': now}
        return self.exec.update_by_id(record_id, data)
