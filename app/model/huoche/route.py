from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RouteModel:
    TABLE_NAME = 'tb_huoche_route'
    
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
                code TEXT NOT NULL UNIQUE,
                description TEXT,
                distance REAL NOT NULL,
                difficulty INTEGER DEFAULT 1,
                scenery_type TEXT,
                min_speed INTEGER DEFAULT 30,
                max_speed INTEGER DEFAULT 120,
                base_reward INTEGER DEFAULT 100,
                base_exp INTEGER DEFAULT 50,
                unlock_level INTEGER DEFAULT 1,
                estimated_time INTEGER DEFAULT 60,
                weather_effect INTEGER DEFAULT 1,
                image_url TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        
        cls._init_default_data()

    @classmethod
    def _init_default_data(cls):
        db = get_db()
        default_routes = [
            {
                'name': '田园风光线',
                'code': 'countryside',
                'description': '穿越美丽的乡村田野，适合新手练习驾驶。沿途可以看到金黄的麦田和悠闲的农场。',
                'distance': 100.0,
                'difficulty': 1,
                'scenery_type': '田园',
                'min_speed': 30,
                'max_speed': 80,
                'base_reward': 100,
                'base_exp': 50,
                'unlock_level': 1,
                'estimated_time': 30,
                'weather_effect': 1,
                'image_url': '/static/huoche_web/images/route_countryside.png'
            },
            {
                'name': '山间峡谷线',
                'code': 'mountain',
                'description': '穿越险峻的山间峡谷，需要精湛的驾驶技术。沿途风景壮丽，有桥梁和隧道。',
                'distance': 180.0,
                'difficulty': 2,
                'scenery_type': '山岳',
                'min_speed': 40,
                'max_speed': 100,
                'base_reward': 250,
                'base_exp': 120,
                'unlock_level': 2,
                'estimated_time': 45,
                'weather_effect': 2,
                'image_url': '/static/huoche_web/images/route_mountain.png'
            },
            {
                'name': '沿海风景线',
                'code': 'coastal',
                'description': '沿着美丽的海岸线行驶，海风拂面，碧海蓝天。需要注意海风对速度的影响。',
                'distance': 250.0,
                'difficulty': 3,
                'scenery_type': '海岸',
                'min_speed': 50,
                'max_speed': 140,
                'base_reward': 500,
                'base_exp': 200,
                'unlock_level': 3,
                'estimated_time': 60,
                'weather_effect': 3,
                'image_url': '/static/huoche_web/images/route_coastal.png'
            },
            {
                'name': '城际快线',
                'code': 'intercity',
                'description': '连接大城市的快速通道，需要严格遵守时刻表。考验准时发车和精准停站的能力。',
                'distance': 300.0,
                'difficulty': 4,
                'scenery_type': '城市',
                'min_speed': 80,
                'max_speed': 200,
                'base_reward': 800,
                'base_exp': 350,
                'unlock_level': 4,
                'estimated_time': 50,
                'weather_effect': 2,
                'image_url': '/static/huoche_web/images/route_intercity.png'
            },
            {
                'name': '雪域高原线',
                'code': 'snow',
                'description': '穿越雪域高原的极限挑战路线。极端天气和复杂路况需要最优秀的驾驶员。',
                'distance': 400.0,
                'difficulty': 5,
                'scenery_type': '雪域',
                'min_speed': 40,
                'max_speed': 120,
                'base_reward': 1200,
                'base_exp': 500,
                'unlock_level': 5,
                'estimated_time': 90,
                'weather_effect': 5,
                'image_url': '/static/huoche_web/images/route_snow.png'
            }
        ]
        
        for route in default_routes:
            existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE code = ?", (route['code'],))
            if not existing:
                now = datetime.now().isoformat()
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                       (name, code, description, distance, difficulty, scenery_type, 
                        min_speed, max_speed, base_reward, base_exp, unlock_level, 
                        estimated_time, weather_effect, image_url, status, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (route['name'], route['code'], route['description'], route['distance'],
                     route['difficulty'], route['scenery_type'], route['min_speed'], route['max_speed'],
                     route['base_reward'], route['base_exp'], route['unlock_level'],
                     route['estimated_time'], route['weather_effect'], route['image_url'],
                     1, now, now)
                )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='difficulty ASC')

    def get_available_by_level(self, level: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = 1 AND unlock_level <= ?
            ORDER BY difficulty ASC
        """
        return self.db.fetch_all(sql, (level,))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
