from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserResourceModel:
    TABLE_NAME = 'tb_ty_model_user_resources'

    STATUS_ACTIVE = 1
    STATUS_USED = 0

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
                resource_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_resource_id ON {cls.TABLE_NAME}(resource_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_resource ON {cls.TABLE_NAME}(user_id, resource_id)"
        db.execute(index_sql)

    def add_resource(self, user_id: int, resource_id: int, quantity: int = 1) -> int:
        existing = self.query.find_one({
            'user_id': user_id,
            'resource_id': resource_id,
            'status': self.STATUS_ACTIVE
        })

        now = datetime.now().isoformat()
        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            return self.exec.update_by_id(existing.get('id'), {
                'quantity': new_quantity,
                'updated_at': now
            })
        else:
            data = {
                'user_id': user_id,
                'resource_id': resource_id,
                'quantity': quantity,
                'status': self.STATUS_ACTIVE,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def use_resource(self, user_id: int, resource_id: int, quantity: int = 1) -> bool:
        existing = self.query.find_one({
            'user_id': user_id,
            'resource_id': resource_id,
            'status': self.STATUS_ACTIVE
        })

        if not existing or existing.get('quantity', 0) < quantity:
            return False

        now = datetime.now().isoformat()
        new_quantity = existing.get('quantity', 0) - quantity
        if new_quantity <= 0:
            self.exec.update_by_id(existing.get('id'), {
                'quantity': 0,
                'status': self.STATUS_USED,
                'updated_at': now
            })
        else:
            self.exec.update_by_id(existing.get('id'), {
                'quantity': new_quantity,
                'updated_at': now
            })
        return True

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        sql = f"""
            SELECT ur.*, r.name, r.resource_type, r.rarity, r.description, r.image, r.effect, r.value
            FROM {self.TABLE_NAME} ur
            LEFT JOIN tb_ty_model_resources r ON ur.resource_id = r.id
            WHERE ur.user_id = ? AND ur.status = 1 AND ur.quantity > 0
            ORDER BY ur.id DESC
            LIMIT ? OFFSET ?
        """
        offset = (page - 1) * page_size
        items = self.db.fetch_all(sql, (user_id, page_size, offset))

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE user_id = ? AND status = 1 AND quantity > 0
        """
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_by_user_and_resource(self, user_id: int, resource_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'resource_id': resource_id,
            'status': self.STATUS_ACTIVE
        })

    def get_quantity(self, user_id: int, resource_id: int) -> int:
        result = self.get_by_user_and_resource(user_id, resource_id)
        return result.get('quantity', 0) if result else 0

    def to_public_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.ty_model.resource import ResourceModel
        resource_model = ResourceModel()

        return {
            'id': item.get('id'),
            'user_id': item.get('user_id'),
            'resource_id': item.get('resource_id'),
            'quantity': item.get('quantity'),
            'name': item.get('name'),
            'resource_type': item.get('resource_type'),
            'resource_type_text': resource_model.get_type_text(item.get('resource_type', '')),
            'rarity': item.get('rarity'),
            'rarity_text': resource_model.get_rarity_text(item.get('rarity', 1)),
            'description': item.get('description'),
            'image': item.get('image'),
            'effect': item.get('effect'),
            'value': item.get('value'),
            'created_at': item.get('created_at')
        }
