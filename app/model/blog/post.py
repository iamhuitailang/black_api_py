from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogPostModel:
    TABLE_NAME = 'tb_blog_post'

    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_DELETED = 2

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)
        self.post_tag_model = None

    def _get_post_tag_model(self):
        if not self.post_tag_model:
            from app.model.blog.post_tag import BlogPostTagModel
            self.post_tag_model = BlogPostTagModel()
        return self.post_tag_model

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                slug TEXT,
                summary TEXT,
                content TEXT,
                cover TEXT,
                category_id INTEGER,
                status INTEGER DEFAULT 0,
                is_top INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_top ON {cls.TABLE_NAME}(is_top)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_published_at ON {cls.TABLE_NAME}(published_at)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_slug ON {cls.TABLE_NAME}(slug)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, content: str = '', summary: str = '',
               category_id: int = None, cover: str = None, slug: str = None,
               status: int = 0, tag_ids: List[int] = None, is_top: int = 0) -> int:
        now = datetime.now().isoformat()
        published_at = now if status == self.STATUS_PUBLISHED else None
        data = {
            'user_id': user_id,
            'title': title.strip(),
            'slug': slug,
            'summary': summary or '',
            'content': content or '',
            'cover': cover,
            'category_id': category_id,
            'status': status,
            'is_top': is_top,
            'view_count': 0,
            'comment_count': 0,
            'like_count': 0,
            'published_at': published_at,
            'created_at': now,
            'updated_at': now
        }
        post_id = self.exec.insert(data)
        if post_id > 0 and tag_ids:
            self._get_post_tag_model().set_tags(post_id, tag_ids)
        return post_id

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'slug': slug})

    def increment_view_count(self, post_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (post_id,))
        return cursor.rowcount

    def increment_comment_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET comment_count = MAX(comment_count + ?, 0) WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def increment_like_count(self, post_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET like_count = MAX(like_count + ?, 0) WHERE id = ?"
        cursor = self.db.execute(sql, (delta, post_id))
        return cursor.rowcount

    def update(self, post_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'slug', 'summary', 'content', 'cover', 'category_id', 'status', 'is_top'
        ]}
        if 'title' in update_data:
            update_data['title'] = update_data['title'].strip()
        if update_data.get('status') == self.STATUS_PUBLISHED:
            existing = self.get_by_id(post_id)
            if existing and not existing.get('published_at'):
                update_data['published_at'] = now
        update_data['updated_at'] = now
        affected = self.exec.update_by_id(post_id, update_data)
        if affected >= 0 and 'tag_ids' in data:
            self._get_post_tag_model().set_tags(post_id, data['tag_ids'] or [])
        return affected

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_DELETED, 'updated_at': datetime.now().isoformat()})

    def hard_delete(self, record_id: int) -> int:
        self._get_post_tag_model().delete_by_post(record_id)
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='is_top DESC, published_at DESC, created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 category_id: int = None, tag_id: int = None, status: int = None,
                 user_id: int = None, keyword: str = None,
                 order_by: str = 'is_top DESC, published_at DESC, created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if category_id is not None:
            conditions['category_id'] = category_id
        if status is not None:
            conditions['status'] = status
        if user_id is not None:
            conditions['user_id'] = user_id

        if keyword or tag_id is not None:
            return self.search(keyword or '', page, page_size, category_id, tag_id, status, user_id, order_by)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category_id: int = None, tag_id: int = None, status: int = None,
               user_id: int = None, order_by: str = 'is_top DESC, published_at DESC, created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        from_sql = self.TABLE_NAME
        if tag_id is not None:
            from_sql = f"{self.TABLE_NAME} p INNER JOIN tb_blog_post_tag pt ON pt.post_id = p.id"
            where_clauses.append("pt.tag_id = ?")
            params.append(tag_id)

        if category_id is not None:
            where_clauses.append(f"{self.TABLE_NAME if tag_id is None else 'p'}.category_id = ?")
            params.append(category_id)

        if status is not None:
            where_clauses.append(f"{self.TABLE_NAME if tag_id is None else 'p'}.status = ?")
            params.append(status)

        if user_id is not None:
            where_clauses.append(f"{self.TABLE_NAME if tag_id is None else 'p'}.user_id = ?")
            params.append(user_id)

        if keyword:
            table_prefix = 'p.' if tag_id is not None else ''
            where_clauses.append(f"({table_prefix}title LIKE ? OR {table_prefix}summary LIKE ? OR {table_prefix}content LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

        table_prefix = 'p.' if tag_id is not None else ''
        distinct = 'DISTINCT' if tag_id is not None else ''

        count_sql = f"""
            SELECT COUNT({distinct} {table_prefix}id) as total 
            FROM {from_sql} 
            WHERE {' AND '.join(where_clauses)}
        """
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT {distinct} {table_prefix}* FROM {from_sql}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY {order_by}
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
            self.STATUS_DRAFT: '草稿',
            self.STATUS_PUBLISHED: '已发布',
            self.STATUS_DELETED: '已删除'
        }
        return status_map.get(status, '未知')

    def to_dict(self, post: Dict[str, Any], with_tags: bool = True, with_author: bool = True, with_category: bool = True) -> Dict[str, Any]:
        data = {
            'id': post.get('id'),
            'user_id': post.get('user_id'),
            'title': post.get('title'),
            'slug': post.get('slug'),
            'summary': post.get('summary'),
            'content': post.get('content'),
            'cover': post.get('cover'),
            'category_id': post.get('category_id'),
            'status': post.get('status'),
            'status_text': self.get_status_text(post.get('status') or 0),
            'is_top': post.get('is_top'),
            'view_count': post.get('view_count') or 0,
            'comment_count': post.get('comment_count') or 0,
            'like_count': post.get('like_count') or 0,
            'published_at': post.get('published_at'),
            'created_at': post.get('created_at'),
            'updated_at': post.get('updated_at')
        }

        if with_category and post.get('category_id'):
            from app.model.blog.category import BlogCategoryModel
            cat_model = BlogCategoryModel()
            cat = cat_model.get_by_id(post.get('category_id'))
            if cat:
                data['category'] = cat_model.to_dict(cat, with_count=True)
            else:
                data['category'] = None

        if with_tags:
            tag_list = self._get_post_tag_model().get_tags_by_post(post.get('id'))
            from app.model.blog.tag import BlogTagModel
            tag_model = BlogTagModel()
            data['tags'] = [tag_model.to_dict(t, with_count=True) for t in tag_list]

        if with_author:
            from app.model.blog.user import BlogUserModel
            user_model = BlogUserModel()
            author = user_model.get_by_id(post.get('user_id'))
            if author:
                data['author'] = user_model.to_dict(author)

        return data
