from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CarModel:
    TABLE_NAME = 'tb_saiche_model_cars'

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
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                base_speed INTEGER DEFAULT 100,
                base_acceleration INTEGER DEFAULT 50,
                base_handling INTEGER DEFAULT 50,
                base_nitro INTEGER DEFAULT 100,
                max_speed INTEGER DEFAULT 200,
                max_acceleration INTEGER DEFAULT 100,
                max_handling INTEGER DEFAULT 100,
                max_nitro INTEGER DEFAULT 200,
                upgrade_cost INTEGER DEFAULT 100,
                price INTEGER DEFAULT 0,
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_default ON {cls.TABLE_NAME}(is_default)"
        db.execute(index_sql)

    @classmethod
    def init_default_cars(cls):
        model = cls()
        existing = model.query.count()
        if existing == 0:
            default_cars = [
                {
                    'name': '新手赛车',
                    'description': '入门级赛车，适合新手练习',
                    'image': '',
                    'base_speed': 100,
                    'base_acceleration': 50,
                    'base_handling': 50,
                    'base_nitro': 100,
                    'max_speed': 180,
                    'max_acceleration': 90,
                    'max_handling': 90,
                    'max_nitro': 180,
                    'upgrade_cost': 100,
                    'price': 0,
                    'is_default': 1
                },
                {
                    'name': '闪电跑车',
                    'description': '追求速度的选择，极速更高',
                    'image': '',
                    'base_speed': 120,
                    'base_acceleration': 45,
                    'base_handling': 45,
                    'base_nitro': 90,
                    'max_speed': 220,
                    'max_acceleration': 85,
                    'max_handling': 85,
                    'max_nitro': 170,
                    'upgrade_cost': 120,
                    'price': 5000,
                    'is_default': 0
                },
                {
                    'name': '漂移之王',
                    'description': '操控性极佳，擅长弯道漂移',
                    'image': '',
                    'base_speed': 95,
                    'base_acceleration': 55,
                    'base_handling': 70,
                    'base_nitro': 80,
                    'max_speed': 170,
                    'max_acceleration': 100,
                    'max_handling': 130,
                    'max_nitro': 160,
                    'upgrade_cost': 110,
                    'price': 8000,
                    'is_default': 0
                },
                {
                    'name': '氮气战车',
                    'description': '氮气容量更大，加速更持久',
                    'image': '',
                    'base_speed': 105,
                    'base_acceleration': 60,
                    'base_handling': 50,
                    'base_nitro': 130,
                    'max_speed': 190,
                    'max_acceleration': 110,
                    'max_handling': 90,
                    'max_nitro': 240,
                    'upgrade_cost': 115,
                    'price': 10000,
                    'is_default': 0
                }
            ]
            for car in default_cars:
                car['created_at'] = datetime.now().isoformat()
                model.exec.insert(car)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, is_default: int = None) -> Dict[str, Any]:
        conditions = {}
        if is_default is not None:
            conditions['is_default'] = is_default
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_default_car(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'is_default': 1})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'image', 'base_speed', 'base_acceleration',
            'base_handling', 'base_nitro', 'max_speed', 'max_acceleration',
            'max_handling', 'max_nitro', 'upgrade_cost', 'price', 'is_default'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def calculate_stats(self, car: Dict[str, Any], levels: Dict[str, int]) -> Dict[str, int]:
        max_level = 10
        speed_level = min(levels.get('speed_level', 0), max_level)
        acceleration_level = min(levels.get('acceleration_level', 0), max_level)
        handling_level = min(levels.get('handling_level', 0), max_level)
        nitro_level = min(levels.get('nitro_level', 0), max_level)

        base_speed = car.get('base_speed', 100)
        max_speed = car.get('max_speed', 200)
        speed = int(base_speed + (max_speed - base_speed) * speed_level / max_level)

        base_acceleration = car.get('base_acceleration', 50)
        max_acceleration = car.get('max_acceleration', 100)
        acceleration = int(base_acceleration + (max_acceleration - base_acceleration) * acceleration_level / max_level)

        base_handling = car.get('base_handling', 50)
        max_handling = car.get('max_handling', 100)
        handling = int(base_handling + (max_handling - base_handling) * handling_level / max_level)

        base_nitro = car.get('base_nitro', 100)
        max_nitro = car.get('max_nitro', 200)
        nitro = int(base_nitro + (max_nitro - base_nitro) * nitro_level / max_level)

        return {
            'speed': speed,
            'acceleration': acceleration,
            'handling': handling,
            'nitro': nitro
        }

    def to_public_dict(self, car: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': car.get('id'),
            'name': car.get('name'),
            'description': car.get('description'),
            'image': car.get('image'),
            'base_speed': car.get('base_speed'),
            'base_acceleration': car.get('base_acceleration'),
            'base_handling': car.get('base_handling'),
            'base_nitro': car.get('base_nitro'),
            'max_speed': car.get('max_speed'),
            'max_acceleration': car.get('max_acceleration'),
            'max_handling': car.get('max_handling'),
            'max_nitro': car.get('max_nitro'),
            'upgrade_cost': car.get('upgrade_cost'),
            'price': car.get('price'),
            'is_default': car.get('is_default'),
            'created_at': car.get('created_at')
        }
