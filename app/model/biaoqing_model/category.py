from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_biaoqing_model_categories'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                emoji_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        default_categories = [
            {'name': '搞笑', 'icon': '😂', 'description': '各种搞笑表情包', 'sort_order': 1},
            {'name': '可爱', 'icon': '🥰', 'description': '萌萌哒表情包', 'sort_order': 2},
            {'name': '怼人', 'icon': '😤', 'description': '互怼专用表情包', 'sort_order': 3},
            {'name': '撩妹', 'icon': '😘', 'description': '撩妹撩汉表情包', 'sort_order': 4},
            {'name': '斗图', 'icon': '🤜', 'description': '斗图必备表情包', 'sort_order': 5},
            {'name': '猫咪', 'icon': '🐱', 'description': '可爱猫咪表情包', 'sort_order': 6},
            {'name': '狗狗', 'icon': '🐶', 'description': '可爱狗狗表情包', 'sort_order': 7},
            {'name': '动漫', 'icon': '🎌', 'description': '动漫二次元表情包', 'sort_order': 8},
            {'name': '明星', 'icon': '⭐', 'description': '明星真人表情包', 'sort_order': 9},
            {'name': '其他', 'icon': '📦', 'description': '其他类型表情包', 'sort_order': 10},
        ]
        for cat in default_categories:
            existing = model.query.find_one({'name': cat['name']})
            if not existing:
                model.create(**cat)

    def create(self, name: str, icon: str = '', description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'icon': icon,
            'description': description,
            'sort_order': sort_order,
            'emoji_count': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'icon', 'description', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_emoji_count(self, category_id: int, delta: int = 1) -> int:
        category = self.get_by_id(category_id)
        if not category:
            return 0
        new_count = max(0, category.get('emoji_count', 0) + delta)
        return self.exec.update_by_id(category_id, {'emoji_count': new_count})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 100, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def get_all_list(self, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='sort_order ASC, id ASC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '启用',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'icon': category.get('icon'),
            'description': category.get('description'),
            'sort_order': category.get('sort_order'),
            'emoji_count': category.get('emoji_count'),
            'status': category.get('status'),
            'status_text': self.get_status_text(category.get('status')),
            'created_at': category.get('created_at')
        }
