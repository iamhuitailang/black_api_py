from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CityModel:
    TABLE_NAME = 'tb_jt_model_city'

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
                user_id INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL DEFAULT '我的城市',
                level INTEGER DEFAULT 1,
                population INTEGER DEFAULT 10000,
                area INTEGER DEFAULT 100,
                funds INTEGER DEFAULT 50000,
                satisfaction INTEGER DEFAULT 70,
                traffic_efficiency INTEGER DEFAULT 50,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str = '我的城市') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'level': 1,
            'population': 10000,
            'area': 100,
            'funds': 50000,
            'satisfaction': 70,
            'traffic_efficiency': 50,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def update_city(self, city_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'level', 'population', 'area', 'funds',
            'satisfaction', 'traffic_efficiency'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(city_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, city: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': city.get('id'),
            'user_id': city.get('user_id'),
            'name': city.get('name'),
            'level': city.get('level'),
            'population': city.get('population'),
            'area': city.get('area'),
            'funds': city.get('funds'),
            'satisfaction': city.get('satisfaction'),
            'traffic_efficiency': city.get('traffic_efficiency'),
            'created_at': city.get('created_at'),
            'updated_at': city.get('updated_at')
        }
