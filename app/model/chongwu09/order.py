from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderModel:
    TABLE_NAME = 'tb_chongwu09_model_order'

    STATUS_UNPAID = 0
    STATUS_PAID = 1
    STATUS_IN_PROGRESS = 2
    STATUS_COMPLETED = 3
    STATUS_REFUNDED = 4
    STATUS_CANCELLED = 5

    STATUS_MAP = {
        STATUS_UNPAID: '待支付',
        STATUS_PAID: '已支付',
        STATUS_IN_PROGRESS: '服务中',
        STATUS_COMPLETED: '已完成',
        STATUS_REFUNDED: '已退款',
        STATUS_CANCELLED: '已取消'
    }

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
                service_id INTEGER NOT NULL,
                booking_id INTEGER NOT NULL,
                pet_id INTEGER NOT NULL,
                amount REAL NOT NULL DEFAULT 0,
                days INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                pay_time TIMESTAMP,
                complete_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_service_id ON {cls.TABLE_NAME}(service_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_booking_id ON {cls.TABLE_NAME}(booking_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @staticmethod
    def _generate_order_no() -> str:
        import time
        import random
        timestamp = str(int(time.time() * 1000))[-10:]
        rand = str(random.randint(1000, 9999))
        return f"CW{timestamp}{rand}"

    def create(self, user_id: int, service_id: int, booking_id: int,
               pet_id: int, amount: float, days: int = 1) -> int:
        now = datetime.now().isoformat()
        order_no = self._generate_order_no()
        data = {
            'order_no': order_no,
            'user_id': user_id,
            'service_id': service_id,
            'booking_id': booking_id,
            'pet_id': pet_id,
            'amount': amount,
            'days': days,
            'status': self.STATUS_UNPAID,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def update_status(self, order_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {'status': status, 'updated_at': now}
        if status == self.STATUS_PAID:
            data['pay_time'] = now
        elif status == self.STATUS_COMPLETED:
            data['complete_time'] = now
        return self.exec.update_by_id(order_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if keyword:
            return self.search(keyword, page, page_size, status)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        where_clauses.append("(order_no LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0
        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        return self.STATUS_MAP.get(status, '未知')

    def to_dict(self, order: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': order.get('id'),
            'order_no': order.get('order_no'),
            'user_id': order.get('user_id'),
            'service_id': order.get('service_id'),
            'booking_id': order.get('booking_id'),
            'pet_id': order.get('pet_id'),
            'amount': order.get('amount'),
            'days': order.get('days'),
            'status': order.get('status'),
            'status_text': self.get_status_text(order.get('status')),
            'pay_time': order.get('pay_time'),
            'complete_time': order.get('complete_time'),
            'created_at': order.get('created_at'),
            'updated_at': order.get('updated_at')
        }
