from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_tucao_categories'

    DEFAULT_CATEGORIES = [
        {'code': 'love', 'name': '情感', 'color': '#FF6B6B', 'icon': '💕'},
        {'code': 'work', 'name': '工作', 'color': '#4ECDC4', 'icon': '💼'},
        {'code': 'study', 'name': '学习', 'color': '#45B7D1', 'icon': '📚'},
        {'code': 'life', 'name': '生活', 'color': '#96CEB4', 'icon': '🏠'},
        {'code': 'family', 'name': '家庭', 'color': '#FFEAA7', 'icon': '👨‍👩‍👧'},
        {'code': 'friend', 'name': '友情', 'color': '#DDA0DD', 'icon': '🤝'},
        {'code': 'secret', 'name': '秘密', 'color': '#9B59B6', 'icon': '🔒'},
        {'code': 'other', 'name': '其他', 'color': '#95A5A6', 'icon': '💭'}
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
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#95A5A6',
                icon TEXT DEFAULT '💭',
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        for i, cat in enumerate(cls.DEFAULT_CATEGORIES):
            existing = model.get_by_code(cat['code'])
            if not existing:
                model.create(
                    code=cat['code'],
                    name=cat['name'],
                    color=cat.get('color', '#95A5A6'),
                    icon=cat.get('icon', '💭'),
                    sort_order=i
                )

    def create(self, code: str, name: str, color: str = '#95A5A6',
               icon: str = '💭', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'code': code,
            'name': name,
            'color': color,
            'icon': icon,
            'sort_order': sort_order,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'code': code})

    def get_all(self, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'color', 'icon', 'sort_order', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'code': category.get('code'),
            'name': category.get('name'),
            'color': category.get('color'),
            'icon': category.get('icon'),
            'sort_order': category.get('sort_order'),
            'is_active': category.get('is_active'),
            'created_at': category.get('created_at')
        }
