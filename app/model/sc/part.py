from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScPartModel:
    TABLE_NAME = 'tb_sc_model_parts'

    TYPE_ENGINE = 'engine'
    TYPE_CHASSIS = 'chassis'
    TYPE_SUSPENSION = 'suspension'
    TYPE_TIRE = 'tire'
    TYPE_BODY = 'body'
    TYPE_AERO = 'aero'

    VALID_TYPES = [TYPE_ENGINE, TYPE_CHASSIS, TYPE_SUSPENSION, TYPE_TIRE, TYPE_BODY, TYPE_AERO]

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
                type TEXT NOT NULL,
                tier INTEGER DEFAULT 1,
                price INTEGER DEFAULT 0,
                weight INTEGER DEFAULT 0,
                power INTEGER DEFAULT 0,
                grip INTEGER DEFAULT 0,
                aerodynamics INTEGER DEFAULT 0,
                durability INTEGER DEFAULT 100,
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tier ON {cls.TABLE_NAME}(tier)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_default ON {cls.TABLE_NAME}(is_default)"
        db.execute(index_sql)

    def create(self, name: str, type: str, tier: int = 1, price: int = 0,
               weight: int = 0, power: int = 0, grip: int = 0,
               aerodynamics: int = 0, durability: int = 100,
               description: str = '', image: str = '',
               is_default: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'tier': tier,
            'price': price,
            'weight': weight,
            'power': power,
            'grip': grip,
            'aerodynamics': aerodynamics,
            'durability': durability,
            'description': description,
            'image': image,
            'is_default': is_default,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='tier ASC, id ASC')

    def get_by_type(self, type: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'type': type}
        return self.query.paginate(page, page_size, conditions, order_by='tier ASC, id ASC')

    def get_default_parts(self) -> List[Dict[str, Any]]:
        conditions = {'is_default': 1}
        return self.query.find_all(conditions, order_by='type ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'tier', 'price', 'weight', 'power',
            'grip', 'aerodynamics', 'durability', 'description', 'image', 'is_default'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    @classmethod
    def init_default_parts(cls) -> None:
        instance = cls()
        default_parts = [
            {'name': '基础引擎', 'type': cls.TYPE_ENGINE, 'tier': 1, 'price': 0, 'weight': 100, 'power': 200, 'grip': 0, 'aerodynamics': 0, 'durability': 100, 'is_default': 1},
            {'name': '基础底盘', 'type': cls.TYPE_CHASSIS, 'tier': 1, 'price': 0, 'weight': 200, 'power': 0, 'grip': 10, 'aerodynamics': 0, 'durability': 100, 'is_default': 1},
            {'name': '基础悬挂', 'type': cls.TYPE_SUSPENSION, 'tier': 1, 'price': 0, 'weight': 50, 'power': 0, 'grip': 15, 'aerodynamics': 0, 'durability': 100, 'is_default': 1},
            {'name': '基础轮胎', 'type': cls.TYPE_TIRE, 'tier': 1, 'price': 0, 'weight': 40, 'power': 0, 'grip': 25, 'aerodynamics': 0, 'durability': 100, 'is_default': 1},
            {'name': '基础车身', 'type': cls.TYPE_BODY, 'tier': 1, 'price': 0, 'weight': 150, 'power': 0, 'grip': 5, 'aerodynamics': 10, 'durability': 100, 'is_default': 1},
            {'name': '基础空气动力学套件', 'type': cls.TYPE_AERO, 'tier': 1, 'price': 0, 'weight': 30, 'power': 0, 'grip': 5, 'aerodynamics': 20, 'durability': 100, 'is_default': 1},
        ]

        existing_defaults = instance.get_default_parts()
        if len(existing_defaults) > 0:
            return

        for part in default_parts:
            instance.create(**part)
