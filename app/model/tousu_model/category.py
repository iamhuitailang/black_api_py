from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CategoryModel:
    TABLE_NAME = 'tb_tousu_model_categories'

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
                description TEXT DEFAULT '',
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

    def create(self, name: str, code: str, description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'code': code,
            'description': description,
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

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'code', 'description', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, status: int = None, keyword: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        items = self.query.find_all(conditions, order_by='sort_order ASC, id ASC')
        if keyword:
            items = [item for item in items if keyword in item.get('name', '') or keyword in item.get('code', '')]
        return items

    def to_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'code': category.get('code'),
            'description': category.get('description'),
            'sort_order': category.get('sort_order'),
            'status': category.get('status'),
            'created_at': category.get('created_at'),
            'updated_at': category.get('updated_at')
        }

    @classmethod
    def init_default_categories(cls):
        category_model = cls()
        defaults = [
            ('教学管理', 'teaching', '与教学相关的问题和建议'),
            ('后勤服务', 'logistics', '后勤服务相关的问题和建议'),
            ('校园安全', 'safety', '校园安全相关的问题和建议'),
            ('网络服务', 'network', '网络服务相关的问题和建议'),
            ('图书资源', 'library', '图书资源相关的问题和建议'),
            ('体育设施', 'sports', '体育设施相关的问题和建议'),
            ('宿舍管理', 'dormitory', '宿舍管理相关的问题和建议'),
            ('餐饮服务', 'catering', '餐饮服务相关的问题和建议'),
            ('医疗服务', 'medical', '医疗服务相关的问题和建议'),
            ('其他', 'other', '其他问题和建议')
        ]
        for name, code, desc in defaults:
            existing = category_model.get_by_code(code)
            if not existing:
                category_model.create(name, code, desc)