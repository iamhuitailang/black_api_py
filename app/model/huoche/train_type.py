from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TrainTypeModel:
    TABLE_NAME = 'tb_huoche_train_type'
    
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
                type_code TEXT NOT NULL UNIQUE,
                description TEXT,
                base_speed INTEGER DEFAULT 60,
                max_speed INTEGER DEFAULT 120,
                capacity INTEGER DEFAULT 100,
                fuel_efficiency REAL DEFAULT 1.0,
                reliability REAL DEFAULT 0.95,
                base_price INTEGER DEFAULT 0,
                unlock_level INTEGER DEFAULT 1,
                image_url TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type_code ON {cls.TABLE_NAME}(type_code)"
        db.execute(index_sql)
        
        cls._init_default_data()

    @classmethod
    def _init_default_data(cls):
        db = get_db()
        default_types = [
            {
                'name': '蒸汽机车',
                'type_code': 'steam',
                'description': '经典的蒸汽机车，复古的驾驶体验，适合怀旧的火车爱好者。',
                'base_speed': 40,
                'max_speed': 80,
                'capacity': 80,
                'fuel_efficiency': 0.7,
                'reliability': 0.85,
                'base_price': 0,
                'unlock_level': 1,
                'image_url': '/static/huoche_web/images/steam_train.png'
            },
            {
                'name': '电力机车',
                'type_code': 'electric',
                'description': '现代化的电力机车，速度快、效率高，是城际运输的主力。',
                'base_speed': 70,
                'max_speed': 140,
                'capacity': 120,
                'fuel_efficiency': 1.2,
                'reliability': 0.95,
                'base_price': 5000,
                'unlock_level': 3,
                'image_url': '/static/huoche_web/images/electric_train.png'
            },
            {
                'name': '高速列车',
                'type_code': 'highspeed',
                'description': '最先进的高速列车，极速体验，适合追求速度与激情的玩家。',
                'base_speed': 120,
                'max_speed': 250,
                'capacity': 150,
                'fuel_efficiency': 1.5,
                'reliability': 0.98,
                'base_price': 20000,
                'unlock_level': 5,
                'image_url': '/static/huoche_web/images/highspeed_train.png'
            }
        ]
        
        for train_type in default_types:
            existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE type_code = ?", (train_type['type_code'],))
            if not existing:
                now = datetime.now().isoformat()
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                       (name, type_code, description, base_speed, max_speed, capacity, 
                        fuel_efficiency, reliability, base_price, unlock_level, image_url, status, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (train_type['name'], train_type['type_code'], train_type['description'],
                     train_type['base_speed'], train_type['max_speed'], train_type['capacity'],
                     train_type['fuel_efficiency'], train_type['reliability'], train_type['base_price'],
                     train_type['unlock_level'], train_type['image_url'], 1, now, now)
                )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, type_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'type_code': type_code})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_available_by_level(self, level: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': 1}, order_by='unlock_level ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
