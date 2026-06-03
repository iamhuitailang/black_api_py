from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ResourceModel:
    TABLE_NAME = 'tb_ty_model_resources'

    STATUS_ACTIVE = 1
    STATUS_INACTIVE = 0

    TYPE_PAINT = 'paint'
    TYPE_CANVAS = 'canvas'
    TYPE_SKILL_BOOK = 'skill_book'
    TYPE_MATERIAL = 'material'

    RARITY_COMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

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
                resource_type TEXT NOT NULL,
                rarity INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                effect TEXT,
                value INTEGER DEFAULT 1,
                price INTEGER DEFAULT 10,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(resource_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, name: str, resource_type: str, rarity: int = 1,
               description: str = '', image: str = '', effect: str = '',
               value: int = 1, price: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'resource_type': resource_type,
            'rarity': rarity,
            'description': description,
            'image': image,
            'effect': effect,
            'value': value,
            'price': price,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                resource_type: str = None, rarity: int = None,
                status: int = 1) -> Dict[str, Any]:
        conditions = {'status': status}
        if resource_type:
            conditions['resource_type'] = resource_type
        if rarity:
            conditions['rarity'] = rarity

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_type(self, resource_type: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.get_all(page, page_size, resource_type=resource_type)

    def update(self, resource_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'image', 'effect', 'value', 'price', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(resource_id, update_data)

    def delete(self, resource_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_INACTIVE,
            'updated_at': now
        }
        return self.exec.update_by_id(resource_id, data)

    def get_rarity_text(self, rarity: int) -> str:
        rarity_map = {
            self.RARITY_COMMON: '普通',
            self.RARITY_RARE: '稀有',
            self.RARITY_EPIC: '史诗',
            self.RARITY_LEGENDARY: '传说'
        }
        return rarity_map.get(rarity, '未知')

    def get_type_text(self, resource_type: str) -> str:
        type_map = {
            self.TYPE_PAINT: '颜料',
            self.TYPE_CANVAS: '画布',
            self.TYPE_SKILL_BOOK: '技能书',
            self.TYPE_MATERIAL: '材料'
        }
        return type_map.get(resource_type, '其他')

    def to_public_dict(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': resource.get('id'),
            'name': resource.get('name'),
            'resource_type': resource.get('resource_type'),
            'resource_type_text': self.get_type_text(resource.get('resource_type', '')),
            'rarity': resource.get('rarity'),
            'rarity_text': self.get_rarity_text(resource.get('rarity', 1)),
            'description': resource.get('description'),
            'image': resource.get('image'),
            'effect': resource.get('effect'),
            'value': resource.get('value'),
            'price': resource.get('price'),
            'status': resource.get('status'),
            'created_at': resource.get('created_at')
        }
