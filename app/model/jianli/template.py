from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from .template_category import TemplateCategoryModel


class TemplateModel:
    TABLE_NAME = 'tb_jianli_templates'

    STATUS_PUBLISHED = 1
    STATUS_UNPUBLISHED = 0

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
                category_id INTEGER NOT NULL,
                category_code TEXT DEFAULT '',
                description TEXT DEFAULT '',
                thumbnail TEXT DEFAULT '',
                preview_url TEXT DEFAULT '',
                style_config TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                use_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_code ON {cls.TABLE_NAME}(category_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_templates(cls):
        template_model = cls()
        category_model = TemplateCategoryModel()
        categories = category_model.get_all_active()
        category_map = {cat['code']: cat['id'] for cat in categories}

        default_templates = [
            {
                'name': '简约大气模板',
                'category_code': 'simple',
                'description': '简洁大方的设计风格，适合各种求职场景',
                'thumbnail': '/static/jianli_web/assets/template1.png',
                'style_config': '{"primaryColor": "#2c3e50", "fontFamily": "Microsoft YaHei"}',
                'sort_order': 1,
                'status': 1
            },
            {
                'name': '商务精英模板',
                'category_code': 'business',
                'description': '专业商务风格，适合金融、管理类职位',
                'thumbnail': '/static/jianli_web/assets/template2.png',
                'style_config': '{"primaryColor": "#1a5276", "fontFamily": "SimSun"}',
                'sort_order': 2,
                'status': 1
            },
            {
                'name': '创意设计模板',
                'category_code': 'creative',
                'description': '富有创意的设计，适合设计、创意类岗位',
                'thumbnail': '/static/jianli_web/assets/template3.png',
                'style_config': '{"primaryColor": "#e74c3c", "fontFamily": "KaiTi"}',
                'sort_order': 3,
                'status': 1
            },
            {
                'name': '应届生专属模板',
                'category_code': 'graduate',
                'description': '针对应届生设计，突出教育经历和实习经验',
                'thumbnail': '/static/jianli_web/assets/template4.png',
                'style_config': '{"primaryColor": "#27ae60", "fontFamily": "Microsoft YaHei"}',
                'sort_order': 4,
                'status': 1
            },
            {
                'name': 'IT技术模板',
                'category_code': 'it',
                'description': '专业IT风格，突出技术栈和项目经验',
                'thumbnail': '/static/jianli_web/assets/template5.png',
                'style_config': '{"primaryColor": "#8e44ad", "fontFamily": "Consolas"}',
                'sort_order': 5,
                'status': 1
            },
            {
                'name': '金融财务模板',
                'category_code': 'finance',
                'description': '严谨专业风格，适合金融、财务、会计岗位',
                'thumbnail': '/static/jianli_web/assets/template6.png',
                'style_config': '{"primaryColor": "#2980b9", "fontFamily": "SimSun"}',
                'sort_order': 6,
                'status': 1
            }
        ]

        for tpl in default_templates:
            existing = template_model.query.find_one({'name': tpl['name']})
            if not existing:
                category_code = tpl.pop('category_code')
                tpl['category_id'] = category_map.get(category_code, 0)
                tpl['category_code'] = category_code
                template_model.exec.insert(tpl)
                print(f"  - Created default template: {tpl['name']}")

    def create(self, name: str, category_id: int, category_code: str = '', description: str = '',
               thumbnail: str = '', preview_url: str = '', style_config: str = '',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'category_id': category_id,
            'category_code': category_code,
            'description': description,
            'thumbnail': thumbnail,
            'preview_url': preview_url,
            'style_config': style_config,
            'sort_order': sort_order,
            'status': self.STATUS_UNPUBLISHED,
            'use_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'category_id', 'category_code', 'description',
            'thumbnail', 'preview_url', 'style_config', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def publish(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_PUBLISHED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def unpublish(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_UNPUBLISHED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def increment_use_count(self, record_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET use_count = use_count + 1, updated_at = ? WHERE id = ?"
        now = datetime.now().isoformat()
        cursor = self.db.execute(sql, (now, record_id))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                category_id: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if category_id is not None:
            conditions['category_id'] = category_id

        if keyword:
            return self.search(keyword, page, page_size, status, category_id)

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def get_published(self, page: int = 1, page_size: int = 100,
                      category_id: int = None, category_code: str = None) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_PUBLISHED}
        if category_id is not None:
            conditions['category_id'] = category_id
        if category_code:
            conditions['category_code'] = category_code

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def get_published_list(self, category_id: int = None, category_code: str = None) -> List[Dict[str, Any]]:
        conditions = {'status': self.STATUS_PUBLISHED}
        if category_id is not None:
            conditions['category_id'] = category_id
        if category_code:
            conditions['category_code'] = category_code

        return self.query.find_all(conditions, order_by='sort_order ASC, id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, category_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if category_id is not None:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

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
            self.STATUS_PUBLISHED: '已上架',
            self.STATUS_UNPUBLISHED: '已下架'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, template: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': template.get('id'),
            'name': template.get('name'),
            'category_id': template.get('category_id'),
            'category_code': template.get('category_code'),
            'description': template.get('description'),
            'thumbnail': template.get('thumbnail'),
            'preview_url': template.get('preview_url'),
            'style_config': template.get('style_config'),
            'sort_order': template.get('sort_order'),
            'status': template.get('status'),
            'status_text': self.get_status_text(template.get('status')),
            'use_count': template.get('use_count'),
            'created_at': template.get('created_at')
        }

    def count(self) -> int:
        return self.query.count()

    def count_published(self) -> int:
        return self.query.count({'status': self.STATUS_PUBLISHED})
