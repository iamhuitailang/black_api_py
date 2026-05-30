from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VehicleTypeModel:
    TABLE_NAME = 'tb_chifei_model_vehicle_type'

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
                rate_per_hour REAL NOT NULL DEFAULT 0,
                free_minutes INTEGER NOT NULL DEFAULT 0,
                daily_cap REAL NOT NULL DEFAULT 0,
                icon TEXT DEFAULT '',
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql2)

    @classmethod
    def init_default_vehicle_types(cls):
        model = cls()
        existing = model.query.count()
        if existing > 0:
            return

        default_types = [
            {
                'name': '小型车',
                'code': 'small',
                'rate_per_hour': 5.0,
                'free_minutes': 15,
                'daily_cap': 30.0,
                'icon': '🚗',
                'description': '轿车、SUV',
                'sort_order': 1
            },
            {
                'name': '大型车',
                'code': 'large',
                'rate_per_hour': 8.0,
                'free_minutes': 15,
                'daily_cap': 50.0,
                'icon': '🚐',
                'description': '货车、中巴',
                'sort_order': 2
            },
            {
                'name': '摩托车',
                'code': 'motorcycle',
                'rate_per_hour': 2.0,
                'free_minutes': 30,
                'daily_cap': 10.0,
                'icon': '🏍️',
                'description': '摩托车、电动车',
                'sort_order': 3
            },
            {
                'name': '自行车',
                'code': 'bicycle',
                'rate_per_hour': 1.0,
                'free_minutes': 60,
                'daily_cap': 5.0,
                'icon': '🚲',
                'description': '自行车',
                'sort_order': 4
            }
        ]

        now = datetime.now().isoformat()
        data_list = []
        for item in default_types:
            item['created_at'] = now
            item['updated_at'] = now
            item['is_active'] = 1
            data_list.append(item)

        model.exec.insert_many(data_list)

    def create(self, name: str, code: str, rate_per_hour: float, free_minutes: int,
               daily_cap: float, icon: str = '', description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'code': code,
            'rate_per_hour': rate_per_hour,
            'free_minutes': free_minutes,
            'daily_cap': daily_cap,
            'icon': icon,
            'description': description,
            'sort_order': sort_order,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('code', code)

    def get_all(self, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions=conditions, order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, name: str = None, code: str = None, rate_per_hour: float = None,
               free_minutes: int = None, daily_cap: float = None, icon: str = None,
               description: str = None, sort_order: int = None, is_active: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if name is not None:
            data['name'] = name
        if code is not None:
            data['code'] = code
        if rate_per_hour is not None:
            data['rate_per_hour'] = rate_per_hour
        if free_minutes is not None:
            data['free_minutes'] = free_minutes
        if daily_cap is not None:
            data['daily_cap'] = daily_cap
        if icon is not None:
            data['icon'] = icon
        if description is not None:
            data['description'] = description
        if sort_order is not None:
            data['sort_order'] = sort_order
        if is_active is not None:
            data['is_active'] = is_active

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
