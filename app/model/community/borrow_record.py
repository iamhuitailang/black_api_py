from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BorrowRecordModel:
    TABLE_NAME = 'tb_community_borrow_record'

    STATUS_BORROWED = 'borrowed'
    STATUS_RETURNED = 'returned'
    STATUS_OVERDUE = 'overdue'

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
                request_id INTEGER NOT NULL,
                borrow_date TEXT NOT NULL,
                return_date TEXT,
                expected_return_date TEXT,
                status TEXT DEFAULT 'borrowed',
                reminder_sent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_request_id ON {cls.TABLE_NAME}(request_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_expected_return ON {cls.TABLE_NAME}(expected_return_date)")

    def create(self, request_id: int, borrow_date: str, expected_return_date: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'request_id': request_id,
            'borrow_date': borrow_date,
            'expected_return_date': expected_return_date,
            'status': self.STATUS_BORROWED,
            'reminder_sent': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_request_id(self, request_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'request_id': request_id})

    def get_list_by_borrower(self, borrower_id: int, status: str = None) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT br.*, brr.item_id, brr.borrower_id
            FROM {self.TABLE_NAME} br
            INNER JOIN tb_community_borrow_request brr ON br.request_id = brr.id
            WHERE brr.borrower_id = ?
        """
        params = [borrower_id]
        if status:
            sql += " AND br.status = ?"
            params.append(status)
        sql += " ORDER BY br.id DESC"
        return self.db.fetch_all(sql, tuple(params))

    def get_list_by_owner(self, owner_id: int, status: str = None) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT br.*, brr.item_id, brr.borrower_id
            FROM {self.TABLE_NAME} br
            INNER JOIN tb_community_borrow_request brr ON br.request_id = brr.id
            INNER JOIN tb_community_item i ON brr.item_id = i.id
            WHERE i.owner_id = ?
        """
        params = [owner_id]
        if status:
            sql += " AND br.status = ?"
            params.append(status)
        sql += " ORDER BY br.id DESC"
        return self.db.fetch_all(sql, tuple(params))

    def mark_returned(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'return_date': now[:10],
            'status': self.STATUS_RETURNED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def mark_overdue(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_OVERDUE,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def mark_reminder_sent(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'reminder_sent': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_overdue_records(self, days_overdue: int = 3) -> List[Dict[str, Any]]:
        today = datetime.now().date()
        overdue_date = (today - timedelta(days=days_overdue)).isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE status IN ('borrowed', 'overdue')
            AND expected_return_date IS NOT NULL
            AND expected_return_date <= ?
            AND reminder_sent = 0
        """
        return self.db.fetch_all(sql, (overdue_date,))

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)
