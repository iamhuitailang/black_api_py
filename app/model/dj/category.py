from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_dj_category'

    DEFAULT_CATEGORIES = [
        {'name': '蔬菜水果', 'parent_id': 0, 'sort': 1, 'icon': '🥬'},
        {'name': '肉禽蛋奶', 'parent_id': 0, 'sort': 2, 'icon': '🥩'},
        {'name': '水产海鲜', 'parent_id': 0, 'sort': 3, 'icon': '🦐'},
        {'name': '粮油干货', 'parent_id': 0, 'sort': 4, 'icon': '🌾'},
        {'name': '服装鞋帽', 'parent_id': 0, 'sort': 5, 'icon': '👕'},
        {'name': '日用百货', 'parent_id': 0, 'sort': 6, 'icon': '🧺'},
        {'name': '手工艺品', 'parent_id': 0, 'sort': 7, 'icon': '🎨'},
        {'name': '小吃美食', 'parent_id': 0, 'sort': 8, 'icon': '🍜'},
        {'name': '苗木花卉', 'parent_id': 0, 'sort': 9, 'icon': '🌸'},
        {'name': '其他', 'parent_id': 0, 'sort': 10, 'icon': '📦'},
    ]

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
                parent_id INTEGER DEFAULT 0,
                icon TEXT,
                sort INTEGER DEFAULT 0,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)

        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME} WHERE parent_id = 0")
        if not count or count.get('total', 0) == 0:
            now = datetime.now().isoformat()
            for cat in cls.DEFAULT_CATEGORIES:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (name, parent_id, icon, sort, created_at) VALUES (?, ?, ?, ?, ?)",
                    (cat['name'], cat['parent_id'], cat['icon'], cat['sort'], now)
                )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'name': data.get('name'),
            'parent_id': data.get('parent_id', 0),
            'icon': data.get('icon'),
            'sort': data.get('sort', 0),
            'user_id': data.get('user_id'),
            'created_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort ASC, id ASC')

    def get_parent_categories(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'parent_id': 0}, order_by='sort ASC, id ASC')

    def get_children(self, parent_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'parent_id': parent_id}, order_by='sort ASC, id ASC')

    def get_tree(self) -> List[Dict[str, Any]]:
        parents = self.get_parent_categories()
        for parent in parents:
            parent['children'] = self.get_children(parent.get('id'))
        return parents

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in ['name', 'parent_id', 'icon', 'sort']}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        children = self.get_children(record_id)
        for child in children:
            self.exec.delete_by_id(child.get('id'))
        return self.exec.delete_by_id(record_id)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
