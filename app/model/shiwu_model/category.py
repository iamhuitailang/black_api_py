from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_shiwu_model_categories'

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
                code TEXT NOT NULL UNIQUE,
                icon TEXT DEFAULT '',
                color TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        db = get_db()
        model = cls()
        existing = model.get_all_active()
        if not existing.get('items'):
            default_categories = [
                {'name': '证件类', 'code': 'card', 'icon': '🪪', 'color': '#3B82F6', 'sort_order': 1},
                {'name': '电子产品', 'code': 'electronics', 'icon': '📱', 'color': '#8B5CF6', 'sort_order': 2},
                {'name': '钥匙', 'code': 'key', 'icon': '🔑', 'color': '#F59E0B', 'sort_order': 3},
                {'name': '钱包', 'code': 'wallet', 'icon': '👛', 'color': '#EF4444', 'sort_order': 4},
                {'name': '书籍文具', 'code': 'book', 'icon': '📚', 'color': '#10B981', 'sort_order': 5},
                {'name': '衣物配饰', 'code': 'clothing', 'icon': '👕', 'color': '#EC4899', 'sort_order': 6},
                {'name': '运动器材', 'code': 'sports', 'icon': '⚽', 'color': '#06B6D4', 'sort_order': 7},
                {'name': '其他', 'code': 'other', 'icon': '📦', 'color': '#6B7280', 'sort_order': 8},
            ]
            for cat in default_categories:
                now = datetime.now().isoformat()
                sql = f"""
                    INSERT INTO {cls.TABLE_NAME} 
                    (name, code, icon, color, sort_order, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                db.execute(sql, (cat['name'], cat['code'], cat['icon'], cat['color'], 
                               cat['sort_order'], 1, now, now))
            print("  - Initialized default categories for shiwu")

    def create(self, name: str, code: str, icon: str = '', color: str = '', 
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'code': code,
            'icon': icon,
            'color': color,
            'sort_order': sort_order,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'icon', 'color', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all_active(self) -> Dict[str, Any]:
        conditions = {'status': 1}
        return self.query.paginate(1, 100, conditions, order_by='sort_order ASC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'code': category.get('code'),
            'icon': category.get('icon'),
            'color': category.get('color'),
            'sort_order': category.get('sort_order'),
            'status': category.get('status'),
            'created_at': category.get('created_at')
        }
