from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TransitModel:
    TABLE_NAME = 'tb_jt_model_transit'

    TYPE_BUS = 'bus'
    TYPE_SUBWAY = 'subway'
    TYPE_TRAM = 'tram'
    TYPE_BIKE = 'bike'

    STATUS_INACTIVE = 0
    STATUS_ACTIVE = 1

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
                city_id INTEGER NOT NULL,
                transit_type TEXT DEFAULT 'bus',
                name TEXT DEFAULT '',
                route_data TEXT DEFAULT '{{}}',
                capacity INTEGER DEFAULT 50,
                frequency INTEGER DEFAULT 10,
                fare REAL DEFAULT 2.0,
                ridership INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_transit_type ON {cls.TABLE_NAME}(transit_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, city_id: int, transit_type: str = 'bus', name: str = '',
               route_data: str = '{}', capacity: int = 50, frequency: int = 10,
               fare: float = 2.0) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_id': city_id,
            'transit_type': transit_type,
            'name': name,
            'route_data': route_data,
            'capacity': capacity,
            'frequency': frequency,
            'fare': fare,
            'ridership': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_city_id(self, city_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'city_id': city_id}, order_by='id ASC')

    def update_ridership(self, transit_id: int, ridership: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'ridership': ridership,
            'updated_at': now
        }
        return self.exec.update_by_id(transit_id, data)

    def update(self, transit_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'transit_type', 'name', 'route_data', 'capacity',
            'frequency', 'fare', 'ridership', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(transit_id, update_data)

    def update_status(self, transit_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(transit_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_transit_type_text(self, transit_type: str) -> str:
        type_map = {
            self.TYPE_BUS: '公交车',
            self.TYPE_SUBWAY: '地铁',
            self.TYPE_TRAM: '有轨电车',
            self.TYPE_BIKE: '共享单车'
        }
        return type_map.get(transit_type, '未知')
