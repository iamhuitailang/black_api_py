from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LlkPropModel:
    TABLE_NAME = 'tb_lianliankan077_model_prop'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    EFFECT_HINT = 'hint'
    EFFECT_SHUFFLE = 'shuffle'
    EFFECT_ADD_TIME = 'add_time'
    EFFECT_BOMB = 'bomb'

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
                name TEXT NOT NULL UNIQUE,
                icon TEXT NOT NULL,
                description TEXT DEFAULT '',
                effect_type TEXT NOT NULL,
                effect_value INTEGER DEFAULT 0,
                price INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_effect_type ON {cls.TABLE_NAME}(effect_type)"
        db.execute(index_sql)

    @classmethod
    def init_default_props(cls):
        model = cls()
        defaults = [
            {'name': '提示', 'icon': '💡', 'description': '显示一对可消除的方块', 'effect_type': 'hint', 'effect_value': 1, 'price': 50, 'sort_order': 1},
            {'name': '洗牌', 'icon': '🔄', 'description': '重新打乱所有方块位置', 'effect_type': 'shuffle', 'effect_value': 1, 'price': 80, 'sort_order': 2},
            {'name': '加时', 'icon': '⏰', 'description': '增加30秒游戏时间', 'effect_type': 'add_time', 'effect_value': 30, 'price': 60, 'sort_order': 3},
            {'name': '炸弹', 'icon': '💣', 'description': '消除指定方块及其周围方块', 'effect_type': 'bomb', 'effect_value': 1, 'price': 100, 'sort_order': 4},
        ]
        for item in defaults:
            existing = model.get_by_name(item['name'])
            if not existing:
                model.create(**item)

    def create(self, name: str, icon: str, effect_type: str, description: str = '',
               effect_value: int = 0, price: int = 0, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'icon': icon,
            'description': description,
            'effect_type': effect_type,
            'effect_value': effect_value,
            'price': price,
            'status': self.STATUS_ACTIVE,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, prop_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'icon', 'description', 'effect_type', 'effect_value', 'price', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(prop_id, update_data)

    def update_status(self, prop_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(prop_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def get_active_props(self) -> list:
        return self.query.find_all(
            conditions={'status': self.STATUS_ACTIVE},
            order_by='sort_order ASC, id ASC'
        )

    def to_dict(self, prop: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': prop.get('id'),
            'name': prop.get('name'),
            'icon': prop.get('icon'),
            'description': prop.get('description'),
            'effect_type': prop.get('effect_type'),
            'effect_value': prop.get('effect_value'),
            'price': prop.get('price'),
            'status': prop.get('status'),
            'sort_order': prop.get('sort_order'),
            'created_at': prop.get('created_at')
        }
