from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class OrderModel:
    TABLE_NAME = 'tb_feipin_orders'

    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_COMPLETED = 'completed'
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
                user_id INTEGER NOT NULL,
                collector_id INTEGER,
                category_id INTEGER NOT NULL,
                weight REAL DEFAULT 0.0,
                photos TEXT DEFAULT '[]',
                address TEXT DEFAULT '',
                contact_name TEXT DEFAULT '',
                contact_phone TEXT DEFAULT '',
                schedule_time TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                total_price REAL DEFAULT 0.0,
                actual_price REAL,
                note TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_collector_id ON {cls.TABLE_NAME}(collector_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, category_id: int, weight: float,
               address: str, contact_name: str = '', contact_phone: str = '',
               photos: List[str] = None, schedule_time: str = '',
               total_price: float = 0.0, note: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'category_id': category_id,
            'weight': weight,
            'photos': json.dumps(photos or []),
            'address': address,
            'contact_name': contact_name,
            'contact_phone': contact_phone,
            'schedule_time': schedule_time,
            'status': self.STATUS_PENDING,
            'total_price': total_price,
            'note': note,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            record = self._parse_record(record)
        return record

    def _parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        if record.get('photos'):
            try:
                record['photos'] = json.loads(record['photos'])
            except (json.JSONDecodeError, TypeError):
                record['photos'] = []
        return record

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status:
            conditions['status'] = status
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def get_by_collector_id(self, collector_id: int, page: int = 1, page_size: int = 10,
                             status: str = None) -> Dict[str, Any]:
        conditions = {'collector_id': collector_id}
        if status:
            conditions['status'] = status
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def get_pending_orders(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_PENDING}
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def get_all(self, page: int = 1, page_size: int = 10,
                status: str = None, keyword: str = None) -> Dict[str, Any]:
        if keyword:
            return self.search(keyword, page, page_size, status)
        
        conditions = {}
        if status:
            conditions['status'] = status
        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(address LIKE ? OR contact_name LIKE ? OR contact_phone LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

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
        items = [self._parse_record(item) for item in items]

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def accept_order(self, order_id: int, collector_id: int) -> int:
        order = self.get_by_id(order_id)
        if not order or order.get('status') != self.STATUS_PENDING:
            return 0
        now = datetime.now().isoformat()
        data = {
            'collector_id': collector_id,
            'status': self.STATUS_ACCEPTED,
            'accepted_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def complete_order(self, order_id: int, actual_price: float = None) -> int:
        order = self.get_by_id(order_id)
        if not order or order.get('status') != self.STATUS_ACCEPTED:
            return 0
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COMPLETED,
            'actual_price': actual_price,
            'completed_at': now,
            'updated_at': now
        }
        if actual_price is None:
            data['actual_price'] = order.get('total_price', 0)
        return self.exec.update_by_id(order_id, data)

    def cancel_order(self, order_id: int) -> int:
        order = self.get_by_id(order_id)
        if not order or order.get('status') not in [self.STATUS_PENDING, self.STATUS_ACCEPTED]:
            return 0
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        }
        return self.exec.update_by_id(order_id, data)

    def get_user_income(self, user_id: int) -> float:
        sql = f"""
            SELECT COALESCE(SUM(actual_price), 0) as total
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND status = ?
        """
        result = self.db.fetch_one(sql, (user_id, self.STATUS_COMPLETED))
        return result['total'] if result else 0.0

    def get_collector_income(self, collector_id: int) -> float:
        sql = f"""
            SELECT COALESCE(SUM(actual_price), 0) as total
            FROM {self.TABLE_NAME}
            WHERE collector_id = ? AND status = ?
        """
        result = self.db.fetch_one(sql, (collector_id, self.STATUS_COMPLETED))
        return result['total'] if result else 0.0

    def get_collector_monthly_stats(self, collector_id: int, year: int, month: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(actual_price), 0) as total_income
            FROM {self.TABLE_NAME}
            WHERE collector_id = ? 
                AND status = ?
                AND strftime('%Y', created_at) = ?
                AND strftime('%m', created_at) = ?
        """
        result = self.db.fetch_one(sql, (collector_id, self.STATUS_COMPLETED, str(year), f"{month:02d}"))
        return {
            'order_count': result['order_count'] if result else 0,
            'total_income': result['total_income'] if result else 0.0
        }

    def get_statistics(self) -> Dict[str, Any]:
        sql_total = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME}"
        sql_pending = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        sql_completed = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE status = ?"
        sql_income = f"SELECT COALESCE(SUM(actual_price), 0) as total FROM {self.TABLE_NAME} WHERE status = ?"

        total_result = self.db.fetch_one(sql_total)
        pending_result = self.db.fetch_one(sql_pending, (self.STATUS_PENDING,))
        completed_result = self.db.fetch_one(sql_completed, (self.STATUS_COMPLETED,))
        income_result = self.db.fetch_one(sql_income, (self.STATUS_COMPLETED,))

        return {
            'total_orders': total_result['count'] if total_result else 0,
            'pending_orders': pending_result['count'] if pending_result else 0,
            'completed_orders': completed_result['count'] if completed_result else 0,
            'total_income': income_result['total'] if income_result else 0.0
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_PENDING: '待接单',
            self.STATUS_ACCEPTED: '已接单',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, order: Dict[str, Any]) -> Dict[str, Any]:
        order = self._parse_record(order)
        return {
            'id': order.get('id'),
            'user_id': order.get('user_id'),
            'collector_id': order.get('collector_id'),
            'category_id': order.get('category_id'),
            'weight': order.get('weight'),
            'photos': order.get('photos', []),
            'address': order.get('address'),
            'contact_name': order.get('contact_name'),
            'contact_phone': order.get('contact_phone'),
            'schedule_time': order.get('schedule_time'),
            'status': order.get('status'),
            'status_text': self.get_status_text(order.get('status')),
            'total_price': order.get('total_price'),
            'actual_price': order.get('actual_price'),
            'note': order.get('note'),
            'created_at': order.get('created_at'),
            'accepted_at': order.get('accepted_at'),
            'completed_at': order.get('completed_at')
        }
