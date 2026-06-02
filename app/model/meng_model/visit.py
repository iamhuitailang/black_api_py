from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VisitModel:
    TABLE_NAME = 'tb_meng_model_visits'

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
                visitor_id INTEGER NOT NULL,
                dream_id INTEGER NOT NULL,
                visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                duration INTEGER DEFAULT 0,
                left_message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_visitor_id ON {cls.TABLE_NAME}(visitor_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dream_id ON {cls.TABLE_NAME}(dream_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_visited_at ON {cls.TABLE_NAME}(visited_at)"
        db.execute(index_sql)

    def create(self, visitor_id: int, dream_id: int, duration: int = 0, left_message: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'visitor_id': visitor_id,
            'dream_id': dream_id,
            'visited_at': now,
            'duration': duration,
            'left_message': left_message,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_dream(self, dream_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'dream_id': dream_id}
        return self.query.paginate(page, page_size, conditions, order_by='visited_at DESC')

    def get_by_visitor(self, visitor_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'visitor_id': visitor_id}
        return self.query.paginate(page, page_size, conditions, order_by='visited_at DESC')

    def get_recent(self, limit: int = 10, dream_id: int = None, visitor_id: int = None) -> List[Dict[str, Any]]:
        where_clauses = ["1=1"]
        params = []

        if dream_id is not None:
            where_clauses.append("dream_id = ?")
            params.append(dream_id)

        if visitor_id is not None:
            where_clauses.append("visitor_id = ?")
            params.append(visitor_id)

        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY visited_at DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, tuple(params))

    def update_duration(self, record_id: int, duration: int) -> int:
        data = {
            'duration': duration
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, visit: Dict[str, Any]) -> Dict[str, Any]:
        if not visit:
            return {}
        return {
            'id': visit.get('id'),
            'visitor_id': visit.get('visitor_id'),
            'dream_id': visit.get('dream_id'),
            'visited_at': visit.get('visited_at'),
            'duration': visit.get('duration'),
            'left_message': visit.get('left_message'),
            'created_at': visit.get('created_at')
        }
