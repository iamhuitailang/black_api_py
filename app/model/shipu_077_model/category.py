from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_shipu_077_model_categories'

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
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                recipe_count INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        default_categories = [
            {'name': '家常菜', 'description': '简单易学的家常菜谱', 'icon': '', 'sort_order': 1},
            {'name': '川菜', 'description': '麻辣鲜香的四川菜', 'icon': '', 'sort_order': 2},
            {'name': '粤菜', 'description': '清淡鲜美的广东菜', 'icon': '', 'sort_order': 3},
            {'name': '湘菜', 'description': '酸辣可口的湖南菜', 'icon': '', 'sort_order': 4},
            {'name': '甜点', 'description': '甜蜜美味的甜点烘焙', 'icon': '', 'sort_order': 5},
            {'name': '汤羹', 'description': '营养滋补的汤品羹类', 'icon': '', 'sort_order': 6},
            {'name': '凉菜', 'description': '清爽开胃的凉拌菜', 'icon': '', 'sort_order': 7},
            {'name': '主食', 'description': '米饭面条等主食', 'icon': '', 'sort_order': 8}
        ]

        for cat in default_categories:
            existing = model.get_by_name(cat['name'])
            if not existing:
                model.create(
                    name=cat['name'],
                    description=cat['description'],
                    icon=cat['icon'],
                    sort_order=cat['sort_order']
                )

    def create(self, name: str, description: str = '', icon: str = '',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'icon': icon,
            'sort_order': sort_order,
            'recipe_count': 0,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_all(self, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 keyword: str = None) -> Dict[str, Any]:
        if keyword:
            return self.search(keyword, page, page_size)
        return self.query.paginate(page, page_size, {}, order_by='sort_order ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        like_pattern = f"%{keyword}%"

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE name LIKE ?"
        total_result = self.db.fetch_one(count_sql, (like_pattern,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE name LIKE ?
            ORDER BY sort_order ASC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (like_pattern,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'icon', 'sort_order', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def increment_recipe_count(self, category_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET recipe_count = recipe_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, category_id))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'description': category.get('description'),
            'icon': category.get('icon'),
            'sort_order': category.get('sort_order'),
            'recipe_count': category.get('recipe_count'),
            'is_active': category.get('is_active'),
            'created_at': category.get('created_at')
        }
