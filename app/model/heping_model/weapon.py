from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WeaponModel:
    TABLE_NAME = 'tb_heping_model_weapons'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    TYPE_PISTOL = 'pistol'
    TYPE_RIFLE = 'rifle'
    TYPE_SNIPER = 'sniper'
    TYPE_SHOTGUN = 'shotgun'
    TYPE_SMG = 'smg'

    RARITY_COMMON = 'common'
    RARITY_UNCOMMON = 'uncommon'
    RARITY_RARE = 'rare'
    RARITY_EPIC = 'epic'
    RARITY_LEGENDARY = 'legendary'

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
                damage REAL DEFAULT 0,
                fire_rate REAL DEFAULT 0,
                range REAL DEFAULT 0,
                accuracy REAL DEFAULT 0,
                ammo_capacity INTEGER DEFAULT 0,
                rarity TEXT DEFAULT 'common',
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, name: str, type: str, damage: float = 0, fire_rate: float = 0,
               range: float = 0, accuracy: float = 0, ammo_capacity: int = 0,
               rarity: str = 'common', description: str = '', icon: str = '',
               status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'damage': damage,
            'fire_rate': fire_rate,
            'range': range,
            'accuracy': accuracy,
            'ammo_capacity': ammo_capacity,
            'rarity': rarity,
            'description': description,
            'icon': icon,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, type: str = None, rarity: str = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type
        if rarity:
            conditions['rarity'] = rarity
        return self.query.paginate(page, page_size, conditions if conditions else None, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        allowed_fields = ['name', 'type', 'damage', 'fire_rate', 'range', 'accuracy',
                          'ammo_capacity', 'rarity', 'description', 'icon', 'status']
        for field in allowed_fields:
            if field in kwargs and kwargs[field] is not None:
                data[field] = kwargs[field]

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_type(self, weapon_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': weapon_type, 'status': self.STATUS_ENABLED},
                                   order_by='id DESC')

    def get_by_rarity(self, rarity: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'rarity': rarity, 'status': self.STATUS_ENABLED},
                                   order_by='id DESC')

    @classmethod
    def init_default_weapons(cls):
        model = cls()
        if model.query.count() > 0:
            return

        weapons = [
            {'name': 'P92', 'type': 'pistol', 'damage': 35, 'fire_rate': 3.5, 'range': 50, 'accuracy': 60, 'ammo_capacity': 15, 'rarity': 'common', 'description': '经典的9mm手枪，易于获取'},
            {'name': 'P1911', 'type': 'pistol', 'damage': 41, 'fire_rate': 3.0, 'range': 50, 'accuracy': 65, 'ammo_capacity': 7, 'rarity': 'common', 'description': '.45口径手枪，伤害较高'},
            {'name': 'M416', 'type': 'rifle', 'damage': 41, 'fire_rate': 12.0, 'range': 400, 'accuracy': 75, 'ammo_capacity': 30, 'rarity': 'rare', 'description': '全能型突击步枪，配件丰富'},
            {'name': 'AKM', 'type': 'rifle', 'damage': 49, 'fire_rate': 10.0, 'range': 400, 'accuracy': 60, 'ammo_capacity': 30, 'rarity': 'uncommon', 'description': '高伤害突击步枪，后坐力较大'},
            {'name': 'SCAR-L', 'type': 'rifle', 'damage': 41, 'fire_rate': 11.0, 'range': 400, 'accuracy': 70, 'ammo_capacity': 30, 'rarity': 'uncommon', 'description': '稳定可靠的突击步枪'},
            {'name': 'AWM', 'type': 'sniper', 'damage': 120, 'fire_rate': 1.8, 'range': 600, 'accuracy': 95, 'ammo_capacity': 5, 'rarity': 'legendary', 'description': '空投专属狙击枪，一击致命'},
            {'name': 'Kar98K', 'type': 'sniper', 'damage': 79, 'fire_rate': 1.9, 'range': 500, 'accuracy': 85, 'ammo_capacity': 5, 'rarity': 'rare', 'description': '经典栓动狙击步枪'},
            {'name': 'S686', 'type': 'shotgun', 'damage': 216, 'fire_rate': 2.0, 'range': 30, 'accuracy': 30, 'ammo_capacity': 2, 'rarity': 'common', 'description': '双管霰弹枪，近战利器'},
            {'name': 'S12K', 'type': 'shotgun', 'damage': 198, 'fire_rate': 5.0, 'range': 30, 'accuracy': 25, 'ammo_capacity': 5, 'rarity': 'uncommon', 'description': '半自动霰弹枪'},
            {'name': 'UZI', 'type': 'smg', 'damage': 26, 'fire_rate': 15.0, 'range': 100, 'accuracy': 45, 'ammo_capacity': 25, 'rarity': 'common', 'description': '高射速冲锋枪'},
            {'name': 'UMP45', 'type': 'smg', 'damage': 41, 'fire_rate': 11.0, 'range': 150, 'accuracy': 60, 'ammo_capacity': 25, 'rarity': 'common', 'description': '稳定型冲锋枪，适合新手'},
            {'name': 'M249', 'type': 'rifle', 'damage': 45, 'fire_rate': 13.0, 'range': 400, 'accuracy': 55, 'ammo_capacity': 100, 'rarity': 'legendary', 'description': '空投专属轻机枪，火力压制'}
        ]

        now = datetime.now().isoformat()
        data_list = []
        for w in weapons:
            data_list.append({
                'name': w['name'],
                'type': w['type'],
                'damage': w['damage'],
                'fire_rate': w['fire_rate'],
                'range': w['range'],
                'accuracy': w['accuracy'],
                'ammo_capacity': w['ammo_capacity'],
                'rarity': w['rarity'],
                'description': w['description'],
                'icon': '',
                'status': cls.STATUS_ENABLED,
                'created_at': now,
                'updated_at': now
            })

        model.exec.insert_many(data_list)
