from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SwapRequestModel:
    TABLE_NAME = 'swap_requests'

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
                requester_id INTEGER NOT NULL,
                target_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                target_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_requester ON {cls.TABLE_NAME}(requester_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target ON {cls.TABLE_NAME}(target_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, requester_id: int, target_id: int, date: str, target_date: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'requester_id': requester_id,
            'target_id': target_id,
            'date': date,
            'target_date': target_date,
            'status': 'pending',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, request_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(request_id)

    def get_all(self, status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_requester(self, requester_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'requester_id': requester_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_target(self, target_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'target_id': target_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def update_status(self, request_id: int, status: str) -> int:
        data = {
            'status': status,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(request_id, data)

    def delete(self, request_id: int) -> int:
        return self.exec.delete_by_id(request_id)

    def count(self) -> int:
        return self.query.count()
