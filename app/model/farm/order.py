from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FarmOrderModel:
    TABLE_NAME = 'tb_farm_order'

    STATUS_PENDING_CONFIRM = 'pending_confirm'
    STATUS_ACCEPTED = 'accepted'
    STATUS_PICKING = 'picking'
    STATUS_DELIVERING = 'delivering'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'

    STATUS_FLOW = [
        STATUS_PENDING_CONFIRM,
        STATUS_ACCEPTED,
        STATUS_PICKING,
        STATUS_DELIVERING,
        STATUS_DELIVERED
    ]

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
                consumer_id INTEGER NOT NULL,
                consumer_name TEXT NOT NULL,
                consumer_phone TEXT NOT NULL,
                delivery_address TEXT NOT NULL,
                farmer_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                product_image TEXT DEFAULT '',
                unit_price REAL NOT NULL,
                unit TEXT NOT NULL DEFAULT 'jin',
                quantity INTEGER NOT NULL,
                total_price REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending_confirm',
                paid INTEGER DEFAULT 0,
                expected_delivery TEXT DEFAULT '',
                actual_delivery TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_farmer_id ON {cls.TABLE_NAME}(farmer_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_consumer_id ON {cls.TABLE_NAME}(consumer_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, consumer_id: int, consumer_name: str, consumer_phone: str,
               delivery_address: str, farmer_id: int, product_id: int,
               product_name: str, product_image: str, unit_price: float,
               unit: str, quantity: int, total_price: float,
               expected_delivery: str = '', remark: str = '') -> int:
        now = datetime.now().isoformat()
        order_no = f"ORD{int(datetime.now().timestamp())}{consumer_id}"
        data = {
            'order_no': order_no,
            'consumer_id': consumer_id,
            'consumer_name': consumer_name,
            'consumer_phone': consumer_phone,
            'delivery_address': delivery_address,
            'farmer_id': farmer_id,
            'product_id': product_id,
            'product_name': product_name,
            'product_image': product_image,
            'unit_price': unit_price,
            'unit': unit,
            'quantity': quantity,
            'total_price': total_price,
            'status': self.STATUS_PENDING_CONFIRM,
            'paid': 1,
            'expected_delivery': expected_delivery,
            'remark': remark,
            'status_updated_at': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def get_by_farmer(self, farmer_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'farmer_id': farmer_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_consumer(self, consumer_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'consumer_id': consumer_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_all(self, status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        if conditions:
            return self.query.find_all(conditions, order_by='id DESC')
        return self.query.find_all(order_by='id DESC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'status_updated_at': now,
            'updated_at': now
        }
        if status == self.STATUS_DELIVERED:
            data['actual_delivery'] = now
        return self.exec.update_by_id(record_id, data)

    def advance_status(self, record_id: int) -> Optional[str]:
        order = self.get_by_id(record_id)
        if not order:
            return None
        current_status = order.get('status')
        if current_status not in self.STATUS_FLOW:
            return None
        current_idx = self.STATUS_FLOW.index(current_status)
        if current_idx >= len(self.STATUS_FLOW) - 1:
            return current_status
        next_status = self.STATUS_FLOW[current_idx + 1]
        self.update_status(record_id, next_status)
        return next_status

    def cancel(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CANCELLED)

    def count(self, status: str = None) -> int:
        if status:
            return self.query.count({'status': status})
        return self.query.count()

    def get_farmer_delivery_stats(self, farmer_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN status = 'delivered' AND actual_delivery <= expected_delivery THEN 1 ELSE 0 END) as on_time_count
            FROM {self.TABLE_NAME}
            WHERE farmer_id = ?
        """
        result = self.db.fetch_one(sql, (farmer_id,))
        return result or {'total_orders': 0, 'delivered_count': 0, 'on_time_count': 0}
