from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserCarModel:
    TABLE_NAME = 'tb_saiche_model_user_cars'

    MAX_LEVEL = 10

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
                user_id INTEGER NOT NULL,
                car_id INTEGER NOT NULL,
                speed_level INTEGER DEFAULT 0,
                acceleration_level INTEGER DEFAULT 0,
                handling_level INTEGER DEFAULT 0,
                nitro_level INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_id ON {cls.TABLE_NAME}(car_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_active ON {cls.TABLE_NAME}(user_id, is_active)"
        db.execute(index_sql)

    def create(self, user_id: int, car_id: int, is_active: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'car_id': car_id,
            'speed_level': 0,
            'acceleration_level': 0,
            'handling_level': 0,
            'nitro_level': 0,
            'is_active': is_active,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_car(self, user_id: int, car_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'car_id': car_id})

    def get_user_cars(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT uc.*, c.name, c.description, c.image,
                   c.base_speed, c.base_acceleration, c.base_handling, c.base_nitro,
                   c.max_speed, c.max_acceleration, c.max_handling, c.max_nitro,
                   c.upgrade_cost, c.price, c.is_default
            FROM {self.TABLE_NAME} uc
            LEFT JOIN tb_saiche_model_cars c ON uc.car_id = c.id
            WHERE uc.user_id = ?
            ORDER BY uc.is_active DESC, uc.id ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_active_car(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT uc.*, c.name, c.description, c.image,
                   c.base_speed, c.base_acceleration, c.base_handling, c.base_nitro,
                   c.max_speed, c.max_acceleration, c.max_handling, c.max_nitro,
                   c.upgrade_cost, c.price, c.is_default
            FROM {self.TABLE_NAME} uc
            LEFT JOIN tb_saiche_model_cars c ON uc.car_id = c.id
            WHERE uc.user_id = ? AND uc.is_active = 1
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def set_active_car(self, user_id: int, user_car_id: int) -> int:
        self.exec.update({'is_active': 0}, {'user_id': user_id})
        return self.exec.update_by_id(user_car_id, {'is_active': 1})

    def upgrade_attribute(self, user_car_id: int, attribute: str) -> int:
        valid_attributes = ['speed', 'acceleration', 'handling', 'nitro']
        if attribute not in valid_attributes:
            return 0

        user_car = self.get_by_id(user_car_id)
        if not user_car:
            return 0

        level_field = f'{attribute}_level'
        current_level = user_car.get(level_field, 0)

        if current_level >= self.MAX_LEVEL:
            return 0

        data = {
            level_field: current_level + 1
        }
        return self.exec.update_by_id(user_car_id, data)

    def get_upgrade_cost(self, car: Dict[str, Any], attribute: str, current_level: int) -> int:
        if current_level >= self.MAX_LEVEL:
            return 0

        base_cost = car.get('upgrade_cost', 100)
        return int(base_cost * (1 + current_level * 0.5))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, user_car: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.saiche_model.car import CarModel
        car_model = CarModel()

        levels = {
            'speed_level': user_car.get('speed_level', 0),
            'acceleration_level': user_car.get('acceleration_level', 0),
            'handling_level': user_car.get('handling_level', 0),
            'nitro_level': user_car.get('nitro_level', 0)
        }

        current_stats = car_model.calculate_stats(user_car, levels)

        return {
            'id': user_car.get('id'),
            'user_id': user_car.get('user_id'),
            'car_id': user_car.get('car_id'),
            'name': user_car.get('name'),
            'description': user_car.get('description'),
            'image': user_car.get('image'),
            'speed_level': user_car.get('speed_level'),
            'acceleration_level': user_car.get('acceleration_level'),
            'handling_level': user_car.get('handling_level'),
            'nitro_level': user_car.get('nitro_level'),
            'max_level': self.MAX_LEVEL,
            'current_stats': current_stats,
            'base_stats': {
                'speed': user_car.get('base_speed'),
                'acceleration': user_car.get('base_acceleration'),
                'handling': user_car.get('base_handling'),
                'nitro': user_car.get('base_nitro')
            },
            'max_stats': {
                'speed': user_car.get('max_speed'),
                'acceleration': user_car.get('max_acceleration'),
                'handling': user_car.get('max_handling'),
                'nitro': user_car.get('max_nitro')
            },
            'upgrade_cost': user_car.get('upgrade_cost'),
            'price': user_car.get('price'),
            'is_default': user_car.get('is_default'),
            'is_active': user_car.get('is_active'),
            'created_at': user_car.get('created_at')
        }
