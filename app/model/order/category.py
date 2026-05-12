from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_order_categories'

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
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        categories = model.get_all()
        if categories.get('total', 0) == 0:
            default_categories = [
                {'name': '主食', 'icon': '🍚', 'sort_order': 1},
                {'name': '荤菜', 'icon': '🍖', 'sort_order': 2},
                {'name': '素菜', 'icon': '🥬', 'sort_order': 3},
                {'name': '汤品', 'icon': '🍲', 'sort_order': 4},
                {'name': '饮品', 'icon': '🥤', 'sort_order': 5}
            ]
            for cat in default_categories:
                model.create(**cat)
            print("  - Created default dish categories")

    def create(self, name: str, icon: str = '', sort_order: int = 0) -> int:
        data = {
            'name': name,
            'icon': icon,
            'sort_order': sort_order
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'icon', 'sort_order'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='sort_order ASC, id ASC')

    def get_list(self) -> List[Dict[str, Any]]:
        result = self.get_all(page_size=100)
        return result.get('items', [])