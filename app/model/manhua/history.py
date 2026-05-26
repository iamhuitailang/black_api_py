from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class HistoryModel:
    TABLE_NAME = 'tb_manhua_history'

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
                user_id INTEGER NOT NULL,
                comic_id INTEGER NOT NULL,
                chapter_id INTEGER,
                chapter_no INTEGER DEFAULT 0,
                page_no INTEGER DEFAULT 0,
                last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_comic_id ON {cls.TABLE_NAME}(comic_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_comic ON {cls.TABLE_NAME}(user_id, comic_id)"
        db.execute(index_sql)

    def create(self, user_id: int, comic_id: int, chapter_id: int = None,
               chapter_no: int = 0, page_no: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'comic_id': comic_id,
            'chapter_id': chapter_id,
            'chapter_no': chapter_no,
            'page_no': page_no,
            'last_read_at': now,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_comic(self, user_id: int, comic_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'comic_id': comic_id}, order_by='last_read_at DESC')

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='last_read_at DESC')

    def update_progress(self, record_id: int, chapter_id: int = None,
                        chapter_no: int = 0, page_no: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'chapter_id': chapter_id,
            'chapter_no': chapter_no,
            'page_no': page_no,
            'last_read_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def upsert(self, user_id: int, comic_id: int, chapter_id: int = None,
               chapter_no: int = 0, page_no: int = 0) -> int:
        existing = self.get_by_user_and_comic(user_id, comic_id)
        if existing:
            return self.update_progress(existing.get('id'), chapter_id, chapter_no, page_no)
        return self.create(user_id, comic_id, chapter_id, chapter_no, page_no)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        conditions = {'user_id': user_id}
        return self.exec.delete(conditions)

    def delete_by_user_and_comic(self, user_id: int, comic_id: int) -> int:
        conditions = {'user_id': user_id, 'comic_id': comic_id}
        return self.exec.delete(conditions)