from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class StationModel:
    TABLE_NAME = 'tb_huoche_station'
    
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
                route_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                position INTEGER DEFAULT 0,
                distance_from_start REAL DEFAULT 0,
                stop_time INTEGER DEFAULT 5,
                is_origin INTEGER DEFAULT 0,
                is_terminus INTEGER DEFAULT 0,
                description TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES tb_huoche_route(id)
            )
        """
        db.execute(sql)
        
        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_route_id ON {cls.TABLE_NAME}(route_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql2)
        
        cls._init_default_data()

    @classmethod
    def _init_default_data(cls):
        db = get_db()
        
        route_stations = {
            'countryside': [
                {'name': '田园东站', 'code': 'CS01', 'position': 1, 'distance': 0, 'stop_time': 5, 'is_origin': 1, 'is_terminus': 0},
                {'name': '麦香站', 'code': 'CS02', 'position': 2, 'distance': 30, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '农场站', 'code': 'CS03', 'position': 3, 'distance': 60, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '田园西站', 'code': 'CS04', 'position': 4, 'distance': 100, 'stop_time': 5, 'is_origin': 0, 'is_terminus': 1}
            ],
            'mountain': [
                {'name': '山谷入口站', 'code': 'MT01', 'position': 1, 'distance': 0, 'stop_time': 5, 'is_origin': 1, 'is_terminus': 0},
                {'name': '高桥站', 'code': 'MT02', 'position': 2, 'distance': 45, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '隧道北站', 'code': 'MT03', 'position': 3, 'distance': 90, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '观景台站', 'code': 'MT04', 'position': 4, 'distance': 135, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '山巅站', 'code': 'MT05', 'position': 5, 'distance': 180, 'stop_time': 5, 'is_origin': 0, 'is_terminus': 1}
            ],
            'coastal': [
                {'name': '海港总站', 'code': 'CT01', 'position': 1, 'distance': 0, 'stop_time': 5, 'is_origin': 1, 'is_terminus': 0},
                {'name': '渔村站', 'code': 'CT02', 'position': 2, 'distance': 50, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '沙滩站', 'code': 'CT03', 'position': 3, 'distance': 100, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '礁石站', 'code': 'CT04', 'position': 4, 'distance': 150, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '灯塔站', 'code': 'CT05', 'position': 5, 'distance': 200, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '碧海站', 'code': 'CT06', 'position': 6, 'distance': 250, 'stop_time': 5, 'is_origin': 0, 'is_terminus': 1}
            ],
            'intercity': [
                {'name': '朝阳北站', 'code': 'IC01', 'position': 1, 'distance': 0, 'stop_time': 5, 'is_origin': 1, 'is_terminus': 0},
                {'name': '科技园站', 'code': 'IC02', 'position': 2, 'distance': 75, 'stop_time': 2, 'is_origin': 0, 'is_terminus': 0},
                {'name': '中心广场站', 'code': 'IC03', 'position': 3, 'distance': 150, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '大学城站', 'code': 'IC04', 'position': 4, 'distance': 225, 'stop_time': 2, 'is_origin': 0, 'is_terminus': 0},
                {'name': '夕照南站', 'code': 'IC05', 'position': 5, 'distance': 300, 'stop_time': 5, 'is_origin': 0, 'is_terminus': 1}
            ],
            'snow': [
                {'name': '雪国南站', 'code': 'SN01', 'position': 1, 'distance': 0, 'stop_time': 5, 'is_origin': 1, 'is_terminus': 0},
                {'name': '松林站', 'code': 'SN02', 'position': 2, 'distance': 80, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '冰湖站', 'code': 'SN03', 'position': 3, 'distance': 160, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '雪山站', 'code': 'SN04', 'position': 4, 'distance': 240, 'stop_time': 4, 'is_origin': 0, 'is_terminus': 0},
                {'name': '极地站', 'code': 'SN05', 'position': 5, 'distance': 320, 'stop_time': 3, 'is_origin': 0, 'is_terminus': 0},
                {'name': '雪域北站', 'code': 'SN06', 'position': 6, 'distance': 400, 'stop_time': 5, 'is_origin': 0, 'is_terminus': 1}
            ]
        }
        
        for route_code, stations in route_stations.items():
            route = db.fetch_one("SELECT id FROM tb_huoche_route WHERE code = ?", (route_code,))
            if route:
                route_id = route['id']
                for station in stations:
                    existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE code = ?", (station['code'],))
                    if not existing:
                        now = datetime.now().isoformat()
                        db.execute(
                            f"""INSERT INTO {cls.TABLE_NAME} 
                               (route_id, name, code, position, distance_from_start, stop_time, 
                                is_origin, is_terminus, status, created_at, updated_at) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (route_id, station['name'], station['code'], station['position'],
                             station['distance'], station['stop_time'], station['is_origin'],
                             station['is_terminus'], 1, now, now)
                        )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_route_id(self, route_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'route_id': route_id, 'status': 1}, order_by='position ASC')

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
