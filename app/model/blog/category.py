from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogCategoryModel:
    TABLE_NAME = 'tb_blog_category'

    DEFAULT_CATEGORIES = [
        {'name': '技术笔记', 'slug': 'tech', 'description': '编程、开发、架构相关的技术文章', 'color': '#4f46e5', 'sort': 1},
        {'name': '生活随笔', 'slug': 'life', 'description': '生活感悟、日常记录', 'color': '#10b981', 'sort': 2},
        {'name': '读书影评', 'slug': 'reading', 'description': '读书笔记、电影评论', 'color': '#f59e0b', 'sort': 3},
        {'name': '旅行见闻', 'slug': 'travel', 'description': '旅行记录、风土人情', 'color': '#0ea5e9', 'sort': 4},
        {'name': '产品思考', 'slug': 'product', 'description': '产品设计、用户体验', 'color': '#ec4899', 'sort': 5},
        {'name': '其他', 'slug': 'other', 'description': '未分类的文章', 'color': '#6b7280', 'sort': 99}
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
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                color TEXT,
                sort INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_slug ON {cls.TABLE_NAME}(slug)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort ON {cls.TABLE_NAME}(sort)"
        db.execute(index_sql)

    @classmethod
    def init_default_categories(cls):
        db = get_db()
        now = datetime.now().isoformat()
        for cat in cls.DEFAULT_CATEGORIES:
            exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE slug = ?", (cat['slug'],))
            if not exists:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (name, slug, description, color, sort, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (cat['name'], cat['slug'], cat['description'], cat['color'], cat['sort'], now, now)
                )

    def create(self, name: str, slug: str, description: str = None, color: str = None, sort: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name.strip(),
            'slug': slug.strip().lower(),
            'description': description,
            'color': color,
            'sort': sort,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'slug': slug.strip().lower()})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort ASC, id ASC')

    def get_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if keyword:
            return self.search(keyword, page, page_size)
        return self.query.paginate(page, page_size, conditions, order_by='sort ASC, id ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["(name LIKE ? OR description LIKE ?)"]
        like_pattern = f"%{keyword}%"
        params = [like_pattern, like_pattern]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY sort ASC, id ASC
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

    def update(self, category_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'slug', 'description', 'color', 'sort'
        ]}
        if 'slug' in update_data:
            update_data['slug'] = update_data['slug'].strip().lower()
        if 'name' in update_data:
            update_data['name'] = update_data['name'].strip()
        update_data['updated_at'] = now
        return self.exec.update_by_id(category_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def exists_by_slug(self, slug: str, exclude_id: int = None) -> bool:
        conditions = {'slug': slug.strip().lower()}
        row = self.query.find_one(conditions)
        if not row:
            return False
        if exclude_id and row.get('id') == exclude_id:
            return False
        return True

    def count_posts(self, category_id: int) -> int:
        from app.model.blog.post import BlogPostModel
        post_model = BlogPostModel()
        return post_model.query.count({'category_id': category_id, 'status': 1})

    def to_dict(self, category: Dict[str, Any], with_count: bool = False) -> Dict[str, Any]:
        data = {
            'id': category.get('id'),
            'name': category.get('name'),
            'slug': category.get('slug'),
            'description': category.get('description'),
            'color': category.get('color'),
            'sort': category.get('sort'),
            'created_at': category.get('created_at'),
            'updated_at': category.get('updated_at')
        }
        if with_count:
            data['post_count'] = self.count_posts(category.get('id'))
        return data
