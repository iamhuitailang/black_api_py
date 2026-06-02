from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DafeijiAircraftModel:
    TABLE_NAME = 'tb_dafeiji_model_aircraft'

    TYPE_FIGHTER = 'fighter'
    TYPE_BOMBER = 'bomber'
    TYPE_SCOUT = 'scout'
    TYPE_HEAVY = 'heavy'

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
                hp INTEGER DEFAULT 100,
                attack INTEGER DEFAULT 10,
                speed INTEGER DEFAULT 5,
                defense INTEGER DEFAULT 0,
                bullet_type TEXT DEFAULT 'normal',
                bullet_count INTEGER DEFAULT 1,
                special_ability TEXT DEFAULT '',
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_aircraft(cls):
        model = cls()
        count = model.query.count({})
        if count > 0:
            return
        defaults = [
            {
                'name': '猎鹰-MK1',
                'type': cls.TYPE_FIGHTER,
                'hp': 100,
                'attack': 15,
                'speed': 8,
                'defense': 2,
                'bullet_type': 'normal',
                'bullet_count': 1,
                'special_ability': 'rapid_fire',
                'description': '轻型战斗机，火力均衡，速度快',
                'is_default': 1
            },
            {
                'name': '毁灭者-X9',
                'type': cls.TYPE_BOMBER,
                'hp': 150,
                'attack': 25,
                'speed': 4,
                'defense': 5,
                'bullet_type': 'missile',
                'bullet_count': 1,
                'special_ability': 'bomb',
                'description': '重型轰炸机，攻击力强，速度慢',
                'is_default': 0
            },
            {
                'name': '幽灵-R7',
                'type': cls.TYPE_SCOUT,
                'hp': 70,
                'attack': 10,
                'speed': 12,
                'defense': 1,
                'bullet_type': 'laser',
                'bullet_count': 2,
                'special_ability': 'dodge',
                'description': '侦察机，速度极快，可双发射击',
                'is_default': 0
            },
            {
                'name': '泰坦-Z3',
                'type': cls.TYPE_HEAVY,
                'hp': 200,
                'attack': 20,
                'speed': 3,
                'defense': 10,
                'bullet_type': 'cannon',
                'bullet_count': 3,
                'special_ability': 'shield',
                'description': '重型机甲，防御极高，三路炮火',
                'is_default': 0
            }
        ]
        now = datetime.now().isoformat()
        for item in defaults:
            item['created_at'] = now
            item['updated_at'] = now
            item['icon'] = ''
            model.exec.insert(item)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, type_filter: str = None) -> Dict[str, Any]:
        conditions = {}
        if type_filter:
            conditions['type'] = type_filter
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_all_list(self, type_filter: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if type_filter:
            conditions['type'] = type_filter
        return self.query.find_all(conditions, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'hp', 'attack', 'speed', 'defense',
            'bullet_type', 'bullet_count', 'special_ability', 'description', 'icon', 'is_default'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, aircraft: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': aircraft.get('id'),
            'name': aircraft.get('name'),
            'type': aircraft.get('type'),
            'hp': aircraft.get('hp'),
            'attack': aircraft.get('attack'),
            'speed': aircraft.get('speed'),
            'defense': aircraft.get('defense'),
            'bullet_type': aircraft.get('bullet_type'),
            'bullet_count': aircraft.get('bullet_count'),
            'special_ability': aircraft.get('special_ability'),
            'description': aircraft.get('description'),
            'icon': aircraft.get('icon'),
            'is_default': aircraft.get('is_default'),
            'created_at': aircraft.get('created_at')
        }
