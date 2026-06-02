from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EquipmentModel:
    TABLE_NAME = 'tb_heping_model_equipments'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    TYPE_HELMET = 'helmet'
    TYPE_ARMOR = 'armor'
    TYPE_BACKPACK = 'backpack'
    TYPE_SHOES = 'shoes'
    TYPE_GLOVES = 'gloves'

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
                defense REAL DEFAULT 0,
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

    def create(self, name: str, type: str, defense: float = 0, rarity: str = 'common',
               description: str = '', icon: str = '', status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'defense': defense,
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

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        allowed_fields = ['name', 'type', 'defense', 'rarity', 'description', 'icon', 'status']
        for field in allowed_fields:
            if field in kwargs and kwargs[field] is not None:
                data[field] = kwargs[field]

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    @classmethod
    def init_default_equipments(cls):
        model = cls()
        if model.query.count() > 0:
            return

        equipments = [
            {'name': '一级头盔', 'type': 'helmet', 'defense': 30, 'rarity': 'common', 'description': '基础防护头盔，减少头部伤害'},
            {'name': '二级头盔', 'type': 'helmet', 'defense': 50, 'rarity': 'uncommon', 'description': '强化防护头盔，有效抵挡子弹'},
            {'name': '三级头盔', 'type': 'helmet', 'defense': 80, 'rarity': 'rare', 'description': '军用级头盔，可抵挡狙击枪'},
            {'name': '一级护甲', 'type': 'armor', 'defense': 30, 'rarity': 'common', 'description': '基础防弹衣，提供少量防护'},
            {'name': '二级护甲', 'type': 'armor', 'defense': 55, 'rarity': 'uncommon', 'description': '强化防弹衣，中等防护能力'},
            {'name': '三级护甲', 'type': 'armor', 'defense': 80, 'rarity': 'rare', 'description': '高级防弹衣，强力防护'},
            {'name': '一级背包', 'type': 'backpack', 'defense': 0, 'rarity': 'common', 'description': '小容量背包，增加携带量'},
            {'name': '二级背包', 'type': 'backpack', 'defense': 0, 'rarity': 'uncommon', 'description': '中容量背包，大幅增加携带量'},
            {'name': '三级背包', 'type': 'backpack', 'defense': 0, 'rarity': 'rare', 'description': '大容量背包，最大化携带能力'},
            {'name': '战术手套', 'type': 'gloves', 'defense': 10, 'rarity': 'uncommon', 'description': '加快换弹速度和物品使用速度'}
        ]

        now = datetime.now().isoformat()
        data_list = []
        for e in equipments:
            data_list.append({
                'name': e['name'],
                'type': e['type'],
                'defense': e['defense'],
                'rarity': e['rarity'],
                'description': e['description'],
                'icon': '',
                'status': cls.STATUS_ENABLED,
                'created_at': now,
                'updated_at': now
            })

        model.exec.insert_many(data_list)
