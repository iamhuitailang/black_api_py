from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'orders'
    STATUS_PENDING = 'pending'
    STATUS_COOKING = 'cooking'
    STATUS_SERVED = 'served'

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
                table_number INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_table_number ON {cls.TABLE_NAME}(table_number)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql3)

    def create(self, table_number: int, status: str = STATUS_PENDING) -> int:
        now = datetime.now().isoformat()
        data = {
            'table_number': table_number,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_table(self, table_number: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('table_number', table_number, order_by='created_at DESC')

    def get_all(self, status: str = None, table_number: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if table_number is not None:
            conditions['table_number'] = table_number
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_by_date(self, date_str: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE DATE(created_at) = ? ORDER BY created_at DESC"
        return self.db.fetch_all(sql, (date_str,))

    def get_today_orders(self) -> List[Dict[str, Any]]:
        today = datetime.now().strftime('%Y-%m-%d')
        return self.get_by_date(today)

    def update_status(self, record_id: int, status: str) -> int:
        data = {
            'status': status,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)

    def get_daily_summary(self, date_str: str = None) -> Dict[str, Any]:
        if date_str is None:
            date_str = datetime.now().strftime('%Y-%m-%d')

        sql = f"""
            SELECT 
                o.id as order_id,
                o.table_number,
                o.status,
                o.created_at,
                oi.quantity,
                oi.price,
                oi.dish_name,
                d.category
            FROM {self.TABLE_NAME} o
            JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN dishes d ON oi.dish_id = d.id
            WHERE DATE(o.created_at) = ?
            ORDER BY o.created_at DESC
        """
        return self.db.fetch_all(sql, (date_str,))
