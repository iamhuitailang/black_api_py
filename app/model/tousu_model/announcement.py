from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AnnouncementModel:
    TABLE_NAME = 'tb_tousu_model_announcements'

    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_ARCHIVED = 2

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
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                publisher_id INTEGER NOT NULL,
                status INTEGER DEFAULT 0,
                publish_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_publisher_id ON {cls.TABLE_NAME}(publisher_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, title: str, content: str, publisher_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'content': content,
            'publisher_id': publisher_id,
            'status': self.STATUS_DRAFT,
            'publish_time': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, announcement_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'content', 'status', 'publish_time'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(announcement_id, update_data)

    def publish(self, announcement_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_PUBLISHED,
            'publish_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(announcement_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, 
                status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_published(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, 
                                   {'status': self.STATUS_PUBLISHED}, 
                                   order_by='publish_time DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(title LIKE ? OR content LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY created_at DESC
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
            self.STATUS_ARCHIVED: '已归档'
        }
        return status_map.get(status, '未知')

    def to_dict(self, announcement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': announcement.get('id'),
            'title': announcement.get('title'),
            'content': announcement.get('content'),
            'publisher_id': announcement.get('publisher_id'),
            'status': announcement.get('status'),
            'status_text': self.get_status_text(announcement.get('status')),
            'publish_time': announcement.get('publish_time'),
            'created_at': announcement.get('created_at'),
            'updated_at': announcement.get('updated_at')
        }