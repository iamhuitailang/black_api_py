from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class InventoryModel:
    TABLE_NAME = 'tb_meng_model_inventory'

    ITEM_TYPE_BLOCK = 'block'
    ITEM_TYPE_FRAGMENT = 'fragment'
    ITEM_TYPE_MATERIAL = 'material'

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
                user_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                item_subtype TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                properties TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_type, item_subtype)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_type ON {cls.TABLE_NAME}(item_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_item ON {cls.TABLE_NAME}(user_id, item_type, item_subtype)"
        db.execute(index_sql)

    def create(self, user_id: int, item_type: str, item_subtype: str,
               quantity: int = 1, properties: Dict[str, Any] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'item_type': item_type,
            'item_subtype': item_subtype,
            'quantity': quantity,
            'properties': json.dumps(properties) if properties else '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, item_type: str = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if item_type:
            conditions['item_type'] = item_type
        return self.query.find_all(conditions, order_by='item_type, item_subtype')

    def get_item(self, user_id: int, item_type: str, item_subtype: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'item_type': item_type,
            'item_subtype': item_subtype
        })

    def add_item(self, user_id: int, item_type: str, item_subtype: str,
                 quantity: int = 1, properties: Dict[str, Any] = None) -> int:
        existing = self.get_item(user_id, item_type, item_subtype)
        now = datetime.now().isoformat()

        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            data = {
                'quantity': new_quantity,
                'updated_at': now
            }
            if properties:
                data['properties'] = json.dumps(properties)
            return self.exec.update_by_id(existing['id'], data)
        else:
            return self.create(user_id, item_type, item_subtype, quantity, properties)

    def remove_item(self, user_id: int, item_type: str, item_subtype: str, quantity: int = 1) -> int:
        existing = self.get_item(user_id, item_type, item_subtype)
        if not existing:
            return 0

        current_quantity = existing.get('quantity', 0)
        new_quantity = current_quantity - quantity

        if new_quantity <= 0:
            return self.delete(existing['id'])
        else:
            now = datetime.now().isoformat()
            data = {
                'quantity': new_quantity,
                'updated_at': now
            }
            return self.exec.update_by_id(existing['id'], data)

    def update_quantity(self, record_id: int, quantity: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'quantity': max(0, quantity),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if not record:
            return {}

        properties_data = record.get('properties', '')

        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'item_type': record.get('item_type'),
            'item_subtype': record.get('item_subtype'),
            'quantity': record.get('quantity'),
            'properties': json.loads(properties_data) if properties_data else {},
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at')
        }
