from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MapModel:
    TABLE_NAME = 'tb_heping_model_maps'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    TERRAIN_FOREST = 'forest'
    TERRAIN_DESERT = 'desert'
    TERRAIN_CITY = 'city'
    TERRAIN_ISLAND = 'island'

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
                name TEXT NOT NULL,
                width INTEGER DEFAULT 8000,
                height INTEGER DEFAULT 8000,
                terrain_type TEXT DEFAULT 'forest',
                description TEXT DEFAULT '',
                thumbnail TEXT DEFAULT '',
                safe_zone_speed REAL DEFAULT 1.0,
                max_players INTEGER DEFAULT 100,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_terrain_type ON {cls.TABLE_NAME}(terrain_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, name: str, width: int = 8000, height: int = 8000,
               terrain_type: str = 'forest', description: str = '', thumbnail: str = '',
               safe_zone_speed: float = 1.0, max_players: int = 100,
               status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'width': width,
            'height': height,
            'terrain_type': terrain_type,
            'description': description,
            'thumbnail': thumbnail,
            'safe_zone_speed': safe_zone_speed,
            'max_players': max_players,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        allowed_fields = ['name', 'width', 'height', 'terrain_type', 'description',
                          'thumbnail', 'safe_zone_speed', 'max_players', 'status']
        for field in allowed_fields:
            if field in kwargs and kwargs[field] is not None:
                data[field] = kwargs[field]

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    @classmethod
    def init_default_maps(cls):
        model = cls()
        if model.query.count() > 0:
            return

        maps = [
            {'name': '海岛地图', 'width': 8000, 'height': 8000, 'terrain_type': 'island', 'description': '经典海岛地图，丛林与海滩交织', 'safe_zone_speed': 1.0, 'max_players': 100},
            {'name': '沙漠地图', 'width': 8000, 'height': 8000, 'terrain_type': 'desert', 'description': '广袤沙漠，视野开阔', 'safe_zone_speed': 1.2, 'max_players': 100},
            {'name': '雨林地图', 'width': 6000, 'height': 6000, 'terrain_type': 'forest', 'description': '密林深处，近距离作战', 'safe_zone_speed': 0.8, 'max_players': 80},
            {'name': '城市地图', 'width': 4000, 'height': 4000, 'terrain_type': 'city', 'description': '都市巷战，节奏紧凑', 'safe_zone_speed': 1.5, 'max_players': 60}
        ]

        now = datetime.now().isoformat()
        data_list = []
        for m in maps:
            data_list.append({
                'name': m['name'],
                'width': m['width'],
                'height': m['height'],
                'terrain_type': m['terrain_type'],
                'description': m['description'],
                'thumbnail': '',
                'safe_zone_speed': m['safe_zone_speed'],
                'max_players': m['max_players'],
                'status': cls.STATUS_ENABLED,
                'created_at': now,
                'updated_at': now
            })

        model.exec.insert_many(data_list)
