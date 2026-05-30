from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SearchHistoryModel:
    TABLE_NAME = 'tb_biaoqing_model_search_history'

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
                user_id INTEGER DEFAULT 0,
                keyword TEXT NOT NULL,
                search_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_keyword ON {cls.TABLE_NAME}(keyword)"
        db.execute(index_sql)
        index_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(user_id, keyword)"
        db.execute(index_sql)

    def add(self, user_id: int, keyword: str) -> int:
        keyword = keyword.strip()
        if not keyword:
            return 0

        existing = self.query.find_one({'user_id': user_id, 'keyword': keyword})
        now = datetime.now().isoformat()

        if existing:
            return self.exec.update_by_id(
                existing['id'],
                {'search_count': existing.get('search_count', 0) + 1, 'updated_at': now}
            )
        else:
            data = {
                'user_id': user_id,
                'keyword': keyword,
                'search_count': 1,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_user_history(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        return self.query.find_all(conditions, order_by='updated_at DESC', limit=limit)

    def get_hot_keywords(self, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT keyword, SUM(search_count) as total_count
            FROM {self.TABLE_NAME}
            GROUP BY keyword
            ORDER BY total_count DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.delete({'user_id': user_id})

    def clear_user_history(self, user_id: int) -> int:
        return self.delete_by_user_id(user_id)

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'user_id': item.get('user_id'),
            'keyword': item.get('keyword'),
            'search_count': item.get('search_count'),
            'created_at': item.get('created_at')
        }
