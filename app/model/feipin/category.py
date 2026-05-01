from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_feipin_categories'

    DEFAULT_CATEGORIES = [
        {
            'name': '纸类',
            'parent_id': 0,
            'price': 1.0,
            'description': '纸箱、报纸、书本等',
            'icon': '📦',
            'sort_order': 1
        },
        {
            'name': '塑料',
            'parent_id': 0,
            'price': 2.0,
            'description': 'PET、PE、泡沫等',
            'icon': '🧴',
            'sort_order': 2
        },
        {
            'name': '金属',
            'parent_id': 0,
            'price': 10.0,
            'description': '铁、铜、铝等',
            'icon': '🔩',
            'sort_order': 3
        },
        {
            'name': '电子',
            'parent_id': 0,
            'price': 50.0,
            'description': '手机、电脑、家电等',
            'icon': '📱',
            'sort_order': 4
        },
        {
            'name': '织物',
            'parent_id': 0,
            'price': 0.75,
            'description': '衣服、床单等',
            'icon': '👕',
            'sort_order': 5
        }
    ]

    SUB_CATEGORIES = [
        {'name': '快递纸箱', 'parent_id': 1, 'price': 1.0, 'description': '快递纸箱、瓦楞纸', 'icon': '📦', 'sort_order': 1},
        {'name': '报纸', 'parent_id': 1, 'price': 0.8, 'description': '旧报纸、书刊', 'icon': '📰', 'sort_order': 2},
        {'name': '书本', 'parent_id': 1, 'price': 1.2, 'description': '旧书、杂志', 'icon': '📚', 'sort_order': 3},
        {'name': '矿泉水瓶', 'parent_id': 2, 'price': 2.0, 'description': 'PET塑料瓶', 'icon': '🧴', 'sort_order': 1},
        {'name': '泡沫', 'parent_id': 2, 'price': 1.5, 'description': 'EPS泡沫', 'icon': '🫧', 'sort_order': 2},
        {'name': '易拉罐', 'parent_id': 3, 'price': 3.0, 'description': '铝制易拉罐', 'icon': '🥫', 'sort_order': 1},
        {'name': '铜线', 'parent_id': 3, 'price': 45.0, 'description': '紫铜线', 'icon': '🔌', 'sort_order': 2},
        {'name': '废旧手机', 'parent_id': 4, 'price': 100.0, 'description': '按件回收', 'icon': '📱', 'sort_order': 1},
        {'name': '旧电脑', 'parent_id': 4, 'price': 200.0, 'description': '台式机、笔记本', 'icon': '💻', 'sort_order': 2},
        {'name': '旧衣服', 'parent_id': 5, 'price': 0.75, 'description': '可穿旧衣物', 'icon': '👕', 'sort_order': 1},
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
                price REAL DEFAULT 0.0,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        existing = model.get_by_parent_id(0)
        if not existing:
            for cat in cls.DEFAULT_CATEGORIES:
                model.create(
                    name=cat['name'],
                    parent_id=cat['parent_id'],
                    price=cat['price'],
                    description=cat['description'],
                    icon=cat['icon'],
                    sort_order=cat['sort_order']
                )
            
            main_cats = model.get_by_parent_id(0)
            name_to_id = {cat['name']: cat['id'] for cat in main_cats}
            
            for sub_cat in cls.SUB_CATEGORIES:
                parent_name = None
                if sub_cat['parent_id'] == 1:
                    parent_name = '纸类'
                elif sub_cat['parent_id'] == 2:
                    parent_name = '塑料'
                elif sub_cat['parent_id'] == 3:
                    parent_name = '金属'
                elif sub_cat['parent_id'] == 4:
                    parent_name = '电子'
                elif sub_cat['parent_id'] == 5:
                    parent_name = '织物'
                
                if parent_name and parent_name in name_to_id:
                    model.create(
                        name=sub_cat['name'],
                        parent_id=name_to_id[parent_name],
                        price=sub_cat['price'],
                        description=sub_cat['description'],
                        icon=sub_cat['icon'],
                        sort_order=sub_cat['sort_order']
                    )

    def create(self, name: str, parent_id: int = 0, price: float = 0.0,
               description: str = '', icon: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'parent_id': parent_id,
            'price': price,
            'description': description,
            'icon': icon,
            'sort_order': sort_order,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_parent_id(self, parent_id: int, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {'parent_id': parent_id}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def get_all(self, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def get_tree(self, only_active: bool = True) -> List[Dict[str, Any]]:
        main_categories = self.get_by_parent_id(0, only_active)
        result = []
        for main_cat in main_categories:
            sub_categories = self.get_by_parent_id(main_cat['id'], only_active)
            main_cat_dict = self.to_dict(main_cat)
            main_cat_dict['children'] = [self.to_dict(sub) for sub in sub_categories]
            result.append(main_cat_dict)
        return result

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'parent_id', 'price', 'description', 'icon', 'sort_order', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def delete(self, record_id: int) -> int:
        children = self.get_by_parent_id(record_id, only_active=False)
        for child in children:
            self.exec.delete_by_id(child['id'])
        return self.exec.delete_by_id(record_id)

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'parent_id': category.get('parent_id'),
            'price': category.get('price'),
            'description': category.get('description'),
            'icon': category.get('icon'),
            'sort_order': category.get('sort_order'),
            'is_active': category.get('is_active'),
            'created_at': category.get('created_at')
        }
