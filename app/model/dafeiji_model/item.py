from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DafeijiItemModel:
    TABLE_NAME = 'tb_dafeiji_model_item'

    TYPE_WEAPON = 'weapon'
    TYPE_DEFENSE = 'defense'
    TYPE_SPEED = 'speed'
    TYPE_HEALTH = 'health'
    TYPE_SPECIAL = 'special'

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
                effect_value REAL DEFAULT 0,
                duration INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                drop_rate REAL DEFAULT 0.1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_items(cls):
        model = cls()
        count = model.query.count({})
        if count > 0:
            return
        defaults = [
            {'name': '火力强化', 'type': cls.TYPE_WEAPON, 'effect_value': 1.0, 'duration': 10000, 'description': '武器威力翻倍', 'drop_rate': 0.15},
            {'name': '扩散射击', 'type': cls.TYPE_WEAPON, 'effect_value': 2.0, 'duration': 8000, 'description': '增加射击弹道数', 'drop_rate': 0.10},
            {'name': '能量护盾', 'type': cls.TYPE_DEFENSE, 'effect_value': 50.0, 'duration': 15000, 'description': '生成防护罩吸收伤害', 'drop_rate': 0.08},
            {'name': '纳米修复', 'type': cls.TYPE_HEALTH, 'effect_value': 30.0, 'duration': 0, 'description': '恢复生命值', 'drop_rate': 0.20},
            {'name': '超能引擎', 'type': cls.TYPE_SPEED, 'effect_value': 1.5, 'duration': 10000, 'description': '移动速度提升', 'drop_rate': 0.12},
            {'name': '全屏清除', 'type': cls.TYPE_SPECIAL, 'effect_value': 999.0, 'duration': 0, 'description': '消灭全屏敌人', 'drop_rate': 0.03},
            {'name': '磁力装置', 'type': cls.TYPE_SPECIAL, 'effect_value': 200.0, 'duration': 8000, 'description': '自动吸引附近道具', 'drop_rate': 0.10},
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
            'name', 'type', 'effect_value', 'duration',
            'description', 'icon', 'drop_rate'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'type': item.get('type'),
            'effect_value': item.get('effect_value'),
            'duration': item.get('duration'),
            'description': item.get('description'),
            'icon': item.get('icon'),
            'drop_rate': item.get('drop_rate'),
            'created_at': item.get('created_at')
        }
