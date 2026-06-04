from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CatItemModel:
    TABLE_NAME = 'tb_maomi_model_cat_item'

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
                item_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                is_used INTEGER DEFAULT 0,
                used_at TIMESTAMP DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_id ON {cls.TABLE_NAME}(item_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, item_id: int, item_name: str, quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        existing = self.query.find_one({'user_id': user_id, 'item_id': item_id, 'is_used': 0})
        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            return self.update(existing.get('id'), quantity=new_quantity)
        data = {
            'user_id': user_id,
            'item_id': item_id,
            'item_name': item_name,
            'quantity': quantity,
            'is_used': 0,
            'used_at': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_used': 0},
                                    order_by='created_at DESC')

    def get_by_item_id(self, user_id: int, item_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'item_id': item_id, 'is_used': 0})

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def use_item(self, user_id: int, item_id: int) -> Optional[Dict[str, Any]]:
        cat_item = self.get_by_item_id(user_id, item_id)
        if not cat_item:
            return None
        now = datetime.now().isoformat()
        quantity = cat_item.get('quantity', 1)
        if quantity > 1:
            self.update(cat_item.get('id'), quantity=quantity - 1)
            return self.get_by_id(cat_item.get('id'))
        else:
            self.update(cat_item.get('id'), is_used=1, used_at=now)
            return self.get_by_id(cat_item.get('id'))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def count(self) -> int:
        return self.query.count()
