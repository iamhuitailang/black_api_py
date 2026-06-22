from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OpinionHandlerModel:
    TABLE_NAME = 'tb_opinion_handler'

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
                opinion_id INTEGER NOT NULL,
                handler_id INTEGER NOT NULL,
                handler_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_opinion ON {cls.TABLE_NAME}(opinion_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_handler ON {cls.TABLE_NAME}(handler_id)"
        db.execute(index_sql2)
        unique_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(opinion_id, handler_id)"
        db.execute(unique_sql)

    def add_handler(self, opinion_id: int, handler_id: int, handler_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'opinion_id': opinion_id,
            'handler_id': handler_id,
            'handler_name': handler_name,
            'created_at': now
        }
        try:
            return self.exec.insert(data)
        except Exception:
            return 0

    def add_handlers(self, opinion_id: int, handlers: List[Dict[str, Any]]) -> int:
        count = 0
        for h in handlers:
            rid = self.add_handler(opinion_id, h['id'], h.get('real_name') or h.get('username', ''))
            if rid > 0:
                count += 1
        return count

    def get_by_opinion_id(self, opinion_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'opinion_id': opinion_id}, order_by='id ASC')

    def get_by_handler_id(self, handler_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'handler_id': handler_id}, order_by='id ASC')

    def get_opinion_ids_by_handler(self, handler_id: int) -> List[int]:
        sql = f"SELECT DISTINCT opinion_id FROM {self.TABLE_NAME} WHERE handler_id = ?"
        rows = self.db.fetch_all(sql, (handler_id,))
        return [r['opinion_id'] for r in rows]

    def delete_by_opinion_id(self, opinion_id: int) -> int:
        return self.exec.delete({'opinion_id': opinion_id})

    def is_handler(self, opinion_id: int, handler_id: int) -> bool:
        return self.query.exists({'opinion_id': opinion_id, 'handler_id': handler_id})
