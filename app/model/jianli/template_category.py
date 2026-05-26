from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TemplateCategoryModel:
    TABLE_NAME = 'tb_jianli_template_categories'

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
                code TEXT NOT NULL UNIQUE,
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
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
        category_model = cls()
        default_categories = [
            {'name': '简约风格', 'code': 'simple', 'sort_order': 1},
            {'name': '商务风格', 'code': 'business', 'sort_order': 2},
            {'name': '创意风格', 'code': 'creative', 'sort_order': 3},
            {'name': '应届生', 'code': 'graduate', 'sort_order': 4},
            {'name': 'IT互联网', 'code': 'it', 'sort_order': 5},
            {'name': '金融财务', 'code': 'finance', 'sort_order': 6},
        ]
        for cat in default_categories:
            existing = category_model.get_by_code(cat['code'])
            if not existing:
                category_model.create(**cat)
                print(f"  - Created default template category: {cat['name']}")

    def create(self, name: str, code: str, description: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'code': code,
            'description': description,
            'sort_order': sort_order,
            'status': self.STATUS_ACTIVE,
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
            'name', 'code', 'description', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_ACTIVE},
            order_by='sort_order ASC, id DESC'
        )

    def search(self, keyword: str, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR code LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY sort_order ASC, id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '启用',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, category: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': category.get('id'),
            'name': category.get('name'),
            'code': category.get('code'),
            'description': category.get('description'),
            'sort_order': category.get('sort_order'),
            'status': category.get('status'),
            'status_text': self.get_status_text(category.get('status')),
            'created_at': category.get('created_at')
        }
