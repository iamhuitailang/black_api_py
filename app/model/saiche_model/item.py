from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_saiche_model_items'

    TYPE_SPEED = 'speed'
    TYPE_ATTACK = 'attack'
    TYPE_SHIELD = 'shield'

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
                icon TEXT DEFAULT '',
                type TEXT NOT NULL DEFAULT 'speed',
                effect_value INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                cooldown INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_items(cls):
        model = cls()
        existing = model.query.count()
        if existing == 0:
            default_items = [
                {
                    'name': '氮气加速',
                    'description': '瞬间提升速度，持续3秒',
                    'icon': '⚡',
                    'type': 'speed',
                    'effect_value': 50,
                    'duration': 3,
                    'cooldown': 10
                },
                {
                    'name': '超级加速',
                    'description': '大幅提升速度，持续5秒',
                    'icon': '🚀',
                    'type': 'speed',
                    'effect_value': 80,
                    'duration': 5,
                    'cooldown': 15
                },
                {
                    'name': '导弹',
                    'description': '攻击前方最近的对手，使其减速',
                    'icon': '💥',
                    'type': 'attack',
                    'effect_value': 40,
                    'duration': 2,
                    'cooldown': 8
                },
                {
                    'name': '闪电',
                    'description': '攻击所有对手，使其短暂失控',
                    'icon': '⚡',
                    'type': 'attack',
                    'effect_value': 30,
                    'duration': 1.5,
                    'cooldown': 12
                },
                {
                    'name': '香蕉皮',
                    'description': '在身后放置障碍物，使踩到的对手打滑',
                    'icon': '🍌',
                    'type': 'attack',
                    'effect_value': 50,
                    'duration': 2,
                    'cooldown': 6
                },
                {
                    'name': '护盾',
                    'description': '免疫一次攻击，持续5秒',
                    'icon': '🛡️',
                    'type': 'shield',
                    'effect_value': 100,
                    'duration': 5,
                    'cooldown': 10
                },
                {
                    'name': '磁铁',
                    'description': '吸附前方最近的对手，拉近与对手的距离',
                    'icon': '🧲',
                    'type': 'speed',
                    'effect_value': 30,
                    'duration': 3,
                    'cooldown': 8
                },
                {
                    'name': '云雾',
                    'description': '释放云雾遮挡对手视线',
                    'icon': '🌫️',
                    'type': 'attack',
                    'effect_value': 20,
                    'duration': 4,
                    'cooldown': 10
                }
            ]
            for item in default_items:
                item['created_at'] = datetime.now().isoformat()
                model.exec.insert(item)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, item_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if item_type:
            conditions['type'] = item_type
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_by_type(self, item_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': item_type}, order_by='id ASC')

    def get_random_item(self) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} ORDER BY RANDOM() LIMIT 1"
        return self.db.fetch_one(sql)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'icon', 'type', 'effect_value', 'duration', 'cooldown'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_type_text(self, item_type: str) -> str:
        type_map = {
            self.TYPE_SPEED: '加速类',
            self.TYPE_ATTACK: '攻击类',
            self.TYPE_SHIELD: '防御类'
        }
        return type_map.get(item_type, '未知')

    def to_public_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'description': item.get('description'),
            'icon': item.get('icon'),
            'type': item.get('type'),
            'type_text': self.get_type_text(item.get('type', '')),
            'effect_value': item.get('effect_value'),
            'duration': item.get('duration'),
            'cooldown': item.get('cooldown'),
            'created_at': item.get('created_at')
        }
