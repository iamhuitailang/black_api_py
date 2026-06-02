from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OreModel:
    TABLE_NAME = 'tb_huangjin_model_ore'

    RARITY_COMMON = 0
    RARITY_UNCOMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

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
                value INTEGER NOT NULL DEFAULT 10,
                weight REAL NOT NULL DEFAULT 1.0,
                color TEXT DEFAULT '#FFD700',
                icon TEXT DEFAULT '',
                rarity INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_ores(cls):
        model = cls()
        existing = model.query.count()
        if existing > 0:
            return
        default_ores = [
            {'name': '石头', 'value': 1, 'weight': 3.0, 'color': '#808080', 'rarity': cls.RARITY_COMMON, 'description': '普通的石头，没什么价值', 'sort_order': 1},
            {'name': '铜矿', 'value': 5, 'weight': 2.5, 'color': '#B87333', 'rarity': cls.RARITY_COMMON, 'description': '常见的铜矿石', 'sort_order': 2},
            {'name': '铁矿', 'value': 10, 'weight': 2.0, 'color': '#A19D94', 'rarity': cls.RARITY_UNCOMMON, 'description': '较有价值的铁矿石', 'sort_order': 3},
            {'name': '银矿', 'value': 25, 'weight': 1.5, 'color': '#C0C0C0', 'rarity': cls.RARITY_RARE, 'description': '稀有的银矿石', 'sort_order': 4},
            {'name': '金矿', 'value': 50, 'weight': 1.0, 'color': '#FFD700', 'rarity': cls.RARITY_EPIC, 'description': '珍贵的金矿石', 'sort_order': 5},
            {'name': '钻石', 'value': 100, 'weight': 0.5, 'color': '#B9F2FF', 'rarity': cls.RARITY_LEGENDARY, 'description': '极其珍贵的钻石', 'sort_order': 6},
            {'name': '翡翠', 'value': 80, 'weight': 0.7, 'color': '#50C878', 'rarity': cls.RARITY_EPIC, 'description': '珍贵的翡翠原石', 'sort_order': 7},
            {'name': '红宝石', 'value': 120, 'weight': 0.4, 'color': '#E0115F', 'rarity': cls.RARITY_LEGENDARY, 'description': '传说中的红宝石', 'sort_order': 8},
        ]
        now = datetime.now().isoformat()
        for ore_data in default_ores:
            ore_data['icon'] = ''
            ore_data['status'] = cls.STATUS_ENABLED
            ore_data['created_at'] = now
            ore_data['updated_at'] = now
            model.exec.insert(ore_data)

    def create(self, name: str, value: int, weight: float, color: str = '#FFD700',
               icon: str = '', rarity: int = 0, description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'value': value,
            'weight': weight,
            'color': color,
            'icon': icon,
            'rarity': rarity,
            'description': description,
            'status': self.STATUS_ENABLED,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_enabled(self) -> list:
        return self.query.find_all(
            {'status': self.STATUS_ENABLED},
            order_by='sort_order ASC, id ASC'
        )

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                rarity: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if rarity is not None:
            conditions['rarity'] = rarity
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def update(self, ore_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'value', 'weight', 'color', 'icon', 'rarity', 'description', 'status', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(ore_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def update_status(self, ore_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(ore_id, data)

    @staticmethod
    def get_rarity_text(rarity: int) -> str:
        rarity_map = {
            0: '普通',
            1: '优秀',
            2: '稀有',
            3: '史诗',
            4: '传说'
        }
        return rarity_map.get(rarity, '未知')

    def to_dict(self, ore: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': ore.get('id'),
            'name': ore.get('name'),
            'value': ore.get('value'),
            'weight': ore.get('weight'),
            'color': ore.get('color'),
            'icon': ore.get('icon'),
            'rarity': ore.get('rarity'),
            'rarity_text': self.get_rarity_text(ore.get('rarity')),
            'description': ore.get('description'),
            'status': ore.get('status'),
            'sort_order': ore.get('sort_order'),
            'created_at': ore.get('created_at')
        }
