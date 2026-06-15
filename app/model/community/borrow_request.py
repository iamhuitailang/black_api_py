import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BorrowRequestModel:
    TABLE_NAME = 'tb_community_borrow_request'

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CANCELLED = 'cancelled'

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
                item_id INTEGER NOT NULL,
                borrower_id INTEGER NOT NULL,
                date_range TEXT NOT NULL,
                message TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_id ON {cls.TABLE_NAME}(item_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_borrower_id ON {cls.TABLE_NAME}(borrower_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)")

    def create(self, item_id: int, borrower_id: int, date_range: dict, message: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'item_id': item_id,
            'borrower_id': borrower_id,
            'date_range': json.dumps(date_range, ensure_ascii=False),
            'message': message,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        req = self.query.find_by_id(record_id)
        if req and req.get('date_range'):
            try:
                req['date_range'] = json.loads(req['date_range'])
            except (json.JSONDecodeError, TypeError):
                req['date_range'] = {}
        return req

    def get_list_by_item(self, item_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'item_id': item_id}
        if status:
            conditions['status'] = status
        requests = self.query.find_all(conditions, order_by='id DESC')
        for req in requests:
            if req.get('date_range'):
                try:
                    req['date_range'] = json.loads(req['date_range'])
                except (json.JSONDecodeError, TypeError):
                    req['date_range'] = {}
        return requests

    def get_list_by_borrower(self, borrower_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'borrower_id': borrower_id}
        if status:
            conditions['status'] = status
        requests = self.query.find_all(conditions, order_by='id DESC')
        for req in requests:
            if req.get('date_range'):
                try:
                    req['date_range'] = json.loads(req['date_range'])
                except (json.JSONDecodeError, TypeError):
                    req['date_range'] = {}
        return requests

    def get_list_by_owner(self, owner_id: int, status: str = None) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT br.* FROM {self.TABLE_NAME} br
            INNER JOIN tb_community_item i ON br.item_id = i.id
            WHERE i.owner_id = ?
        """
        params = [owner_id]
        if status:
            sql += " AND br.status = ?"
            params.append(status)
        sql += " ORDER BY br.id DESC"

        requests = self.db.fetch_all(sql, tuple(params))
        for req in requests:
            if req.get('date_range'):
                try:
                    req['date_range'] = json.loads(req['date_range'])
                except (json.JSONDecodeError, TypeError):
                    req['date_range'] = {}
        return requests

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
