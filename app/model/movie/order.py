from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json
import uuid


class OrderModel:
    TABLE_NAME = 'tb_movie_order'

    STATUS_PENDING = 0
    STATUS_PAID = 1
    STATUS_CANCELLED = 2
    STATUS_REFUNDED = 3
    STATUS_VERIFIED = 4

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
                showtime_id INTEGER NOT NULL,
                seats TEXT NOT NULL,
                total_amount REAL NOT NULL DEFAULT 0,
                status INTEGER DEFAULT 0,
                pay_time TEXT DEFAULT '',
                cancel_time TEXT DEFAULT '',
                verified_at TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_no ON {cls.TABLE_NAME}(order_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_showtime_id ON {cls.TABLE_NAME}(showtime_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @staticmethod
    def _generate_order_no() -> str:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = uuid.uuid4().hex[:8].upper()
        return f"MV{timestamp}{random_str}"

    def create(self, user_id: int, showtime_id: int, seats: list,
               total_amount: float) -> int:
        now = datetime.now().isoformat()
        data = {
            'order_no': self._generate_order_no(),
            'user_id': user_id,
            'showtime_id': showtime_id,
            'seats': json.dumps(seats, ensure_ascii=False),
            'total_amount': total_amount,
            'status': self.STATUS_PENDING,
            'pay_time': '',
            'cancel_time': '',
            'verified_at': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_no(self, order_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_no': order_no})

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        for item in result.get('items', []):
            item['seats'] = json.loads(item.get('seats', '[]'))
        return result

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        for item in result.get('items', []):
            item['seats'] = json.loads(item.get('seats', '[]'))
        return result

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("order_no LIKE ?")
        params.append(f"%{keyword}%")

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

        for item in items:
            item['seats'] = json.loads(item.get('seats', '[]'))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }

        if status == self.STATUS_PAID:
            data['pay_time'] = now
        elif status == self.STATUS_CANCELLED:
            data['cancel_time'] = now
        elif status == self.STATUS_VERIFIED:
            data['verified_at'] = now

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_orders(self, status: int = None) -> int:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)

    def get_revenue(self, start_date: str = None, end_date: str = None) -> float:
        where_clauses = ["status IN (?, ?)"]
        params = [self.STATUS_PAID, self.STATUS_VERIFIED]

        if start_date:
            where_clauses.append("created_at >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("created_at <= ?")
            params.append(end_date)

        sql = f"SELECT COALESCE(SUM(total_amount), 0) as revenue FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        result = self.db.fetch_one(sql, tuple(params))
        return result.get('revenue', 0) if result else 0

    def get_sold_seats(self, showtime_id: int) -> List[str]:
        where_clauses = ["showtime_id = ?", "status IN (?, ?)"]
        params = [showtime_id, self.STATUS_PAID, self.STATUS_VERIFIED]
        sql = f"SELECT seats FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        rows = self.db.fetch_all(sql, tuple(params))
        sold = set()
        for row in rows:
            seats_str = row.get('seats', '[]')
            try:
                seats_list = json.loads(seats_str) if isinstance(seats_str, str) else seats_str
                for seat in seats_list:
                    sold.add(seat)
            except (json.JSONDecodeError, TypeError):
                pass
        return list(sold)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待支付',
            self.STATUS_PAID: '已支付',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_REFUNDED: '已退款',
            self.STATUS_VERIFIED: '已核销'
        }
        return status_map.get(status, '未知')