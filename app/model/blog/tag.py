from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogTagModel:
    TABLE_NAME = 'tb_blog_tag'

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
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_slug ON {cls.TABLE_NAME}(slug)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

    def create(self, name: str, slug: str = None, color: str = None) -> int:
        now = datetime.now().isoformat()
        slug = slug or name.strip().lower().replace(' ', '-')
        data = {
            'name': name.strip(),
            'slug': slug.strip().lower(),
            'color': color,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'slug': slug.strip().lower()})

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name.strip()})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def get_by_ids(self, ids: List[int]) -> List[Dict[str, Any]]:
        if not ids:
            return []
        placeholders = ','.join(['?' for _ in ids])
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE id IN ({placeholders})"
        return self.db.fetch_all(sql, tuple(ids))

    def get_or_create(self, name: str, color: str = None) -> int:
        existing = self.get_by_name(name)
        if existing:
            return existing.get('id')
        return self.create(name, name.strip().lower().replace(' ', '-'), color)

    def get_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if keyword:
            return self.search(keyword, page, page_size)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["(name LIKE ? OR slug LIKE ?)"]
        like_pattern = f"%{keyword}%"
        params = [like_pattern, like_pattern]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
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

    def update(self, tag_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['name', 'slug', 'color']}
        if 'slug' in update_data:
            update_data['slug'] = update_data['slug'].strip().lower()
        if 'name' in update_data:
            update_data['name'] = update_data['name'].strip()
        update_data['updated_at'] = now
        return self.exec.update_by_id(tag_id, update_data)

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

    def count_posts(self, tag_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM tb_blog_post_tag WHERE tag_id = ?"
        result = self.db.fetch_one(sql, (tag_id,))
        return result.get('total', 0) if result else 0

    def to_dict(self, tag: Dict[str, Any], with_count: bool = False) -> Dict[str, Any]:
        data = {
            'id': tag.get('id'),
            'name': tag.get('name'),
            'slug': tag.get('slug'),
            'color': tag.get('color'),
            'created_at': tag.get('created_at'),
            'updated_at': tag.get('updated_at')
        }
        if with_count:
            data['post_count'] = self.count_posts(tag.get('id'))
        return data
