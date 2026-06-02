from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_dafuweng_model_item'

    TYPE_ATTACK = 0
    TYPE_DEFENSE = 1
    TYPE_MOVE = 2
    TYPE_ECONOMY = 3

    ITEM_TYPES = [
        {'code': TYPE_ATTACK, 'name': '攻击'},
        {'code': TYPE_DEFENSE, 'name': '防御'},
        {'code': TYPE_MOVE, 'name': '移动'},
        {'code': TYPE_ECONOMY, 'name': '经济'}
    ]

    DEFAULT_ITEMS = [
        {'name': '路障', 'description': '在指定位置放置路障，经过的玩家停留一回合', 'item_type': 0, 'price': 500, 'effect_value': 1, 'icon': '🚧'},
        {'name': '陷阱', 'description': '在指定位置放置陷阱，经过的玩家损失1000金币', 'item_type': 0, 'price': 800, 'effect_value': 1000, 'icon': '🕳️'},
        {'name': '护盾', 'description': '免疫一次攻击类道具效果', 'item_type': 1, 'price': 600, 'effect_value': 1, 'icon': '🛡️'},
        {'name': '免死金牌', 'description': '破产时保留，可免于破产一次', 'item_type': 1, 'price': 2000, 'effect_value': 1, 'icon': '📜'},
        {'name': '加速卡', 'description': '额外前进1-3步', 'item_type': 2, 'price': 400, 'effect_value': 3, 'icon': '⚡'},
        {'name': '传送卡', 'description': '传送到地图上任意位置', 'item_type': 2, 'price': 1000, 'effect_value': 0, 'icon': '🌀'},
        {'name': '加倍卡', 'description': '下次经过起点获得的金币翻倍', 'item_type': 3, 'price': 700, 'effect_value': 2, 'icon': '✖️'},
        {'name': '减税卡', 'description': '免交下次税收', 'item_type': 3, 'price': 500, 'effect_value': 1, 'icon': '🏷️'}
    ]

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
                item_type INTEGER NOT NULL,
                price INTEGER DEFAULT 0,
                effect_value INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_type ON {cls.TABLE_NAME}(item_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_items(cls):
        model = cls()
        existing = model.get_all()
        if not existing:
            for item_data in cls.DEFAULT_ITEMS:
                model.create(**item_data)

    def create(self, name: str, description: str = '', item_type: int = 0,
               price: int = 0, effect_value: int = 0, icon: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'item_type': item_type,
            'price': price,
            'effect_value': effect_value,
            'icon': icon,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='id ASC')

    def get_by_type(self, item_type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'item_type': item_type, 'is_active': 1}, order_by='price ASC')

    def update(self, item_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'item_type', 'price', 'effect_value', 'icon', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(item_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_item_type_name(self, item_type: int) -> str:
        for it in self.ITEM_TYPES:
            if it['code'] == item_type:
                return it['name']
        return '未知'

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'description': item.get('description'),
            'item_type': item.get('item_type'),
            'item_type_name': self.get_item_type_name(item.get('item_type')),
            'price': item.get('price'),
            'effect_value': item.get('effect_value'),
            'icon': item.get('icon'),
            'is_active': item.get('is_active'),
            'created_at': item.get('created_at'),
            'updated_at': item.get('updated_at')
        }
