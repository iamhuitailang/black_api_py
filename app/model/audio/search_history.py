from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SearchHistoryModel:
    TABLE_NAME = 'tb_audio_search_history'
    MAX_RECORDS = 10

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
                keyword TEXT NOT NULL,
                search_type TEXT DEFAULT 'song',
                searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_keyword ON {cls.TABLE_NAME}(keyword)"
        db.execute(index_sql)

    def add(self, keyword: str, search_type: str = 'song') -> int:
        self.exec.delete({'keyword': keyword, 'search_type': search_type})
        now = datetime.now().isoformat()
        data = {
            'keyword': keyword,
            'search_type': search_type,
            'searched_at': now
        }
        record_id = self.exec.insert(data)
        self._trim_history()
        return record_id

    def _trim_history(self):
        count = self.query.count()
        if count > self.MAX_RECORDS:
            excess = count - self.MAX_RECORDS
            sql = f"""
                DELETE FROM {self.TABLE_NAME}
                WHERE id IN (
                    SELECT id FROM {self.TABLE_NAME}
                    ORDER BY searched_at ASC
                    LIMIT ?
                )
            """
            self.db.execute(sql, (excess,))

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='searched_at DESC', limit=self.MAX_RECORDS)

    def delete(self, keyword: str, search_type: str = 'song') -> int:
        return self.exec.delete({'keyword': keyword, 'search_type': search_type})

    def clear(self) -> int:
        return self.exec.execute_raw(f"DELETE FROM {self.TABLE_NAME}")

    def count(self) -> int:
        return self.query.count()