from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DishModel:
    TABLE_NAME = 'dishes'

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
                category TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT,
                spicy_level INTEGER DEFAULT 0,
                image_url TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql2)

    def create(self, name: str, category: str, price: float, description: str = None,
               spicy_level: int = 0, image_url: str = None, is_active: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'category': category,
            'price': price,
            'description': description,
            'spicy_level': spicy_level,
            'image_url': image_url,
            'is_active': is_active,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, category: str = None, is_active: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if category is not None:
            conditions['category'] = category
        if is_active is not None:
            conditions['is_active'] = is_active
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('category', category, order_by='id DESC')

    def update(self, record_id: int, name: str = None, category: str = None, price: float = None,
               description: str = None, spicy_level: int = None, image_url: str = None,
               is_active: int = None) -> int:
        data = {}
        if name is not None:
            data['name'] = name
        if category is not None:
            data['category'] = category
        if price is not None:
            data['price'] = price
        if description is not None:
            data['description'] = description
        if spicy_level is not None:
            data['spicy_level'] = spicy_level
        if image_url is not None:
            data['image_url'] = image_url
        if is_active is not None:
            data['is_active'] = is_active

        if not data:
            return 0

        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def set_active(self, record_id: int, is_active: int) -> int:
        return self.update(record_id, is_active=is_active)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
