from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BlogPostTagModel:
    TABLE_NAME = 'tb_blog_post_tag'

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
                post_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_id ON {cls.TABLE_NAME}(post_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tag_id ON {cls.TABLE_NAME}(tag_id)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_post_tag ON {cls.TABLE_NAME}(post_id, tag_id)"
        db.execute(index_sql)

    def add_tags(self, post_id: int, tag_ids: List[int]) -> int:
        if not tag_ids:
            return 0
        now = datetime.now().isoformat()
        count = 0
        for tag_id in tag_ids:
            try:
                self.exec.insert({
                    'post_id': post_id,
                    'tag_id': tag_id,
                    'created_at': now
                })
                count += 1
            except Exception:
                pass
        return count

    def set_tags(self, post_id: int, tag_ids: List[int]) -> int:
        self.exec.delete({'post_id': post_id})
        return self.add_tags(post_id, tag_ids)

    def get_tag_ids_by_post(self, post_id: int) -> List[int]:
        rows = self.query.find_all({'post_id': post_id}, fields=['tag_id'])
        return [row.get('tag_id') for row in rows]

    def get_post_ids_by_tag(self, tag_id: int) -> List[int]:
        rows = self.query.find_all({'tag_id': tag_id}, fields=['post_id'])
        return [row.get('post_id') for row in rows]

    def delete_by_post(self, post_id: int) -> int:
        return self.exec.delete({'post_id': post_id})

    def delete_by_tag(self, tag_id: int) -> int:
        return self.exec.delete({'tag_id': tag_id})

    def get_tags_by_post(self, post_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT t.* FROM tb_blog_tag t
            INNER JOIN {self.TABLE_NAME} pt ON pt.tag_id = t.id
            WHERE pt.post_id = ?
            ORDER BY t.id ASC
        """
        return self.db.fetch_all(sql, (post_id,))
