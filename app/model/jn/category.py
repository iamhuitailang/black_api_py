from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_jn_categories'

    CATEGORIES = [
        {
            'code': 'programming',
            'name': '编程',
            'description': '编程开发类技能',
            'children': [
                {'code': 'python', 'name': 'Python'},
                {'code': 'frontend', 'name': '前端开发'},
                {'code': 'java', 'name': 'Java'},
                {'code': 'data_analysis', 'name': '数据分析'}
            ]
        },
        {
            'code': 'design',
            'name': '设计',
            'description': '设计创意类技能',
            'children': [
                {'code': 'ui_design', 'name': 'UI设计'},
                {'code': 'ps', 'name': 'Photoshop'},
                {'code': 'video_editing', 'name': '视频剪辑'},
                {'code': '3d_modeling', 'name': '3D建模'}
            ]
        },
        {
            'code': 'language',
            'name': '语言',
            'description': '外语学习类技能',
            'children': [
                {'code': 'english', 'name': '英语'},
                {'code': 'japanese', 'name': '日语'},
                {'code': 'korean', 'name': '韩语'},
                {'code': 'oral_practice', 'name': '口语陪练'}
            ]
        },
        {
            'code': 'music',
            'name': '音乐',
            'description': '音乐艺术类技能',
            'children': [
                {'code': 'guitar', 'name': '吉他'},
                {'code': 'piano', 'name': '钢琴'},
                {'code': 'vocal', 'name': '声乐'},
                {'code': 'arrangement', 'name': '编曲'}
            ]
        },
        {
            'code': 'sports',
            'name': '运动',
            'description': '运动健身类技能',
            'children': [
                {'code': 'fitness', 'name': '健身'},
                {'code': 'swimming', 'name': '游泳'},
                {'code': 'yoga', 'name': '瑜伽'},
                {'code': 'basketball', 'name': '篮球'}
            ]
        },
        {
            'code': 'lifestyle',
            'name': '生活',
            'description': '生活技能类',
            'children': [
                {'code': 'photography', 'name': '摄影'},
                {'code': 'baking', 'name': '烘焙'},
                {'code': 'makeup', 'name': '化妆'},
                {'code': 'flower_arrangement', 'name': '插花'}
            ]
        },
        {
            'code': 'career',
            'name': '职场',
            'description': '职场技能类',
            'children': [
                {'code': 'speech', 'name': '演讲'},
                {'code': 'writing', 'name': '写作'},
                {'code': 'excel', 'name': 'Excel'},
                {'code': 'ppt', 'name': 'PPT'}
            ]
        }
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
                parent_code TEXT DEFAULT '',
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_code ON {cls.TABLE_NAME}(code)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_code ON {cls.TABLE_NAME}(parent_code)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql3)

    @classmethod
    def init_default_categories(cls):
        model = cls()
        sort_order = 0

        for parent in cls.CATEGORIES:
            existing = model.get_by_code(parent['code'])
            if not existing:
                model.create(
                    code=parent['code'],
                    name=parent['name'],
                    parent_code='',
                    description=parent['description'],
                    sort_order=sort_order
                )
            sort_order += 1

            for child in parent.get('children', []):
                existing_child = model.get_by_code(child['code'])
                if not existing_child:
                    model.create(
                        code=child['code'],
                        name=child['name'],
                        parent_code=parent['code'],
                        description='',
                        sort_order=sort_order
                    )
                sort_order += 1

    def create(self, code: str, name: str, parent_code: str = '', description: str = '',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'code': code,
            'name': name,
            'parent_code': parent_code,
            'description': description,
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

    def get_parents(self, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {'parent_code': ''}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def get_children(self, parent_code: str, only_active: bool = True) -> List[Dict[str, Any]]:
        conditions = {'parent_code': parent_code}
        if only_active:
            conditions['is_active'] = 1
        return self.query.find_all(conditions, order_by='sort_order ASC')

    def get_tree(self, only_active: bool = True) -> List[Dict[str, Any]]:
        parents = self.get_parents(only_active)
        result = []
        for parent in parents:
            parent_dict = self.to_dict(parent)
            children = self.get_children(parent['code'], only_active)
            parent_dict['children'] = [self.to_dict(child) for child in children]
            result.append(parent_dict)
        return result

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'sort_order', 'is_active', 'parent_code'
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
            'parent_code': category.get('parent_code'),
            'description': category.get('description'),
            'sort_order': category.get('sort_order'),
            'is_active': category.get('is_active'),
            'created_at': category.get('created_at')
        }
