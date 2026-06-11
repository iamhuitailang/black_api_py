from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_orders'

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
                group_buy_id INTEGER NOT NULL,
                building TEXT DEFAULT '',
                room TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_group_buy_id ON {cls.TABLE_NAME}(group_buy_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql2)

    def create(self, group_buy_id: int, building: str = '', room: str = '',
               phone: str = '', quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'group_buy_id': group_buy_id,
            'building': building,
            'room': room,
            'phone': phone,
            'quantity': quantity,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_group_buy_id(self, group_buy_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'group_buy_id': group_buy_id},
            order_by='created_at DESC'
        )

    def count_by_group_buy_id(self, group_buy_id: int) -> int:
        return self.query.count(conditions={'group_buy_id': group_buy_id})

    def sum_quantity_by_group_buy_id(self, group_buy_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(quantity), 0) as total FROM {self.TABLE_NAME} WHERE group_buy_id = ?"
        result = self.db.fetch_one(sql, (group_buy_id,))
        return result['total'] if result else 0

    def get_statistics(self, group_buy_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(quantity), 0) as total_quantity
            FROM {self.TABLE_NAME} 
            WHERE group_buy_id = ?
        """
        result = self.db.fetch_one(sql, (group_buy_id,))
        return result or {'order_count': 0, 'total_quantity': 0}

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
