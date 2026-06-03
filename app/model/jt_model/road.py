from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RoadModel:
    TABLE_NAME = 'tb_jt_model_road'

    TYPE_NORMAL = 'normal'
    TYPE_HIGHWAY = 'highway'
    TYPE_EXPRESS = 'express'

    STATUS_INACTIVE = 0
    STATUS_ACTIVE = 1
    STATUS_CONSTRUCTION = 2

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
                road_type TEXT NOT NULL DEFAULT 'normal',
                name TEXT DEFAULT '',
                start_x REAL DEFAULT 0,
                start_y REAL DEFAULT 0,
                end_x REAL DEFAULT 100,
                end_y REAL DEFAULT 0,
                lanes INTEGER DEFAULT 2,
                speed_limit INTEGER DEFAULT 60,
                capacity INTEGER DEFAULT 100,
                current_flow INTEGER DEFAULT 0,
                congestion_level INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_road_type ON {cls.TABLE_NAME}(road_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, city_id: int, road_type: str = 'normal', name: str = '',
               start_x: float = 0, start_y: float = 0, end_x: float = 100, end_y: float = 0,
               lanes: int = 2, speed_limit: int = 60, capacity: int = 100) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_id': city_id,
            'road_type': road_type,
            'name': name,
            'start_x': start_x,
            'start_y': start_y,
            'end_x': end_x,
            'end_y': end_y,
            'lanes': lanes,
            'speed_limit': speed_limit,
            'capacity': capacity,
            'current_flow': 0,
            'congestion_level': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_city_id(self, city_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'city_id': city_id}, order_by='id ASC')

    def update_flow(self, road_id: int, current_flow: int, congestion_level: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_flow': current_flow,
            'congestion_level': congestion_level,
            'updated_at': now
        }
        return self.exec.update_by_id(road_id, data)

    def update(self, road_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'road_type', 'name', 'start_x', 'start_y', 'end_x', 'end_y',
            'lanes', 'speed_limit', 'capacity', 'current_flow',
            'congestion_level', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(road_id, update_data)

    def update_status(self, road_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(road_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_INACTIVE: '未启用',
            self.STATUS_ACTIVE: '使用中',
            self.STATUS_CONSTRUCTION: '施工中'
        }
        return status_map.get(status, '未知')

    def get_road_type_text(self, road_type: str) -> str:
        type_map = {
            self.TYPE_NORMAL: '普通道路',
            self.TYPE_HIGHWAY: '高速公路',
            self.TYPE_EXPRESS: '快速路'
        }
        return type_map.get(road_type, '未知')
