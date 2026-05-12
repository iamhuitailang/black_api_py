from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import uuid
import random
import string


class OrderModel:
    TABLE_NAME = 'tb_order_orders'

    STATUS_PENDING = 'pending'
    STATUS_CANCELLED = 'cancelled'
    STATUS_COMPLETED = 'completed'

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
                order_no TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                menu_date TEXT NOT NULL,
                meal_type TEXT DEFAULT 'lunch',
                qrcode TEXT NOT NULL UNIQUE,
                total_amount DECIMAL(10,2) NOT NULL,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                paid_amount DECIMAL(10,2),
                status TEXT DEFAULT 'pending',
                cancel_deadline TIMESTAMP NOT NULL,
                verified_at TIMESTAMP,
                verified_by INTEGER,
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_qrcode ON {cls.TABLE_NAME}(qrcode)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(menu_date)"
        db.execute(index_sql)

    @staticmethod
    def generate_order_no() -> str:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD{timestamp}{random_str}"

    @staticmethod
    def generate_qrcode() -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))

    def create(self, user_id: int, menu_date: str, meal_type: str,
               total_amount: float, discount_amount: float = 0,
               paid_amount: float = None, remark: str = '',
               cancel_deadline_minutes: int = 30) -> Dict[str, Any]:
        order_no = self.generate_order_no()
        qrcode = self.generate_qrcode()

        cancel_deadline = datetime.now() + timedelta(minutes=cancel_deadline_minutes)
        now = datetime.now().isoformat()

        data = {
            'order_no': order_no,
            'user_id': user_id,
            'menu_date': menu_date,
            'meal_type': meal_type,
            'qrcode': qrcode,
            'total_amount': total_amount,
            'discount_amount': discount_amount,
            'paid_amount': paid_amount or total_amount,
            'status': self.STATUS_PENDING,
            'cancel_deadline': cancel_deadline.isoformat(),
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        record_id = self.exec.insert(data)
        return {
            'id': record_id,
            'order_no': order_no,
            'qrcode': qrcode
        }

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def get_by_qrcode(self, qrcode: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'qrcode': qrcode})

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'user_id': user_id}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'total_amount', 'discount_amount', 'paid_amount',
            'status', 'verified_at', 'verified_by', 'remark'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def cancel(self, record_id: int) -> int:
        return self.update(record_id, {'status': self.STATUS_CANCELLED})

    def verify(self, record_id: int, verified_by: int) -> int:
        now = datetime.now().isoformat()
        return self.update(record_id, {
            'status': self.STATUS_COMPLETED,
            'verified_at': now,
            'verified_by': verified_by
        })

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: str = None,
                menu_date: str = None, meal_type: str = None, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status
        if menu_date:
            conditions['menu_date'] = menu_date
        if meal_type:
            conditions['meal_type'] = meal_type
        if user_id:
            conditions['user_id'] = user_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_order_details(self, order_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT od.*, d.name, d.image_url
            FROM tb_order_order_details od
            LEFT JOIN tb_order_dishes d ON od.dish_id = d.id
            WHERE od.order_id = ?
            ORDER BY od.id ASC
        """
        return self.db.fetch_all(sql, (order_id,))

    def get_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["status = 'completed'"]
        params = []

        if start_date:
            where_clauses.append("menu_date >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("menu_date <= ?")
            params.append(end_date)

        where_sql = ' AND '.join(where_clauses)

        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_amount,
                menu_date,
                meal_type
            FROM {self.TABLE_NAME}
            WHERE {where_sql}
            GROUP BY menu_date, meal_type
            ORDER BY menu_date DESC, meal_type
        """
        items = self.db.fetch_all(sql, tuple(params) if params else None)

        total_sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_amount
            FROM {self.TABLE_NAME}
            WHERE {where_sql}
        """
        total_result = self.db.fetch_one(total_sql, tuple(params) if params else None)

        return {
            'items': items,
            'summary': total_result
        }