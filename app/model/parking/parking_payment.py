from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ParkingPaymentModel:
    TABLE_NAME = 'parking_payment'

    STATUS_UNPAID = 'unpaid'
    STATUS_PAID = 'paid'
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
                application_id INTEGER NOT NULL,
                spot_id INTEGER NOT NULL,
                car_plate TEXT NOT NULL,
                applicant_name TEXT NOT NULL,
                amount REAL NOT NULL,
                month TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'unpaid',
                paid_time TIMESTAMP,
                payment_method TEXT,
                remark TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_application_id ON {cls.TABLE_NAME}(application_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_plate ON {cls.TABLE_NAME}(car_plate)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_month ON {cls.TABLE_NAME}(month)"
        db.execute(index_sql4)

    def create(self, application_id: int, spot_id: int, car_plate: str,
               applicant_name: str, amount: float, month: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'application_id': application_id,
            'spot_id': spot_id,
            'car_plate': car_plate,
            'applicant_name': applicant_name,
            'amount': amount,
            'month': month,
            'status': self.STATUS_UNPAID,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_application_id(self, application_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'application_id': application_id}, order_by='month DESC')

    def get_by_car_plate(self, car_plate: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'car_plate': car_plate}, order_by='month DESC')

    def get_all(self, status: str = None, month: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        if month:
            conditions['month'] = month
        return self.query.find_all(conditions, order_by='id DESC', limit=limit)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: str = None, month: str = None) -> int:
        conditions = {}
        if status:
            conditions['status'] = status
        if month:
            conditions['month'] = month
        return self.query.count(conditions)

    def paginate(self, page: int = 1, page_size: int = 10, status: str = None,
                 month: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status
        if month:
            conditions['month'] = month

        if keyword:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE car_plate LIKE ? OR applicant_name LIKE ?
            """
            params = [f'%{keyword}%', f'%{keyword}%']
            if status:
                sql += " AND status = ?"
                params.append(status)
            if month:
                sql += " AND month = ?"
                params.append(month)
            sql += " ORDER BY id DESC"

            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME}
                WHERE car_plate LIKE ? OR applicant_name LIKE ?
            """
            count_params = [f'%{keyword}%', f'%{keyword}%']
            if status:
                count_sql += " AND status = ?"
                count_params.append(status)
            if month:
                count_sql += " AND month = ?"
                count_params.append(month)

            total_result = self.db.fetch_one(count_sql, tuple(count_params))
            total = total_result['total'] if total_result else 0

            offset = (page - 1) * page_size
            sql += f" LIMIT {page_size} OFFSET {offset}"
            items = self.db.fetch_all(sql, tuple(params))

            return {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def mark_paid(self, record_id: int, payment_method: str = 'cash', remark: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_PAID,
            'paid_time': now,
            'payment_method': payment_method
        }
        if remark:
            data['remark'] = remark
        return self.update(record_id, **data)

    def get_statistics(self, month: str = None) -> Dict[str, Any]:
        base_sql = f"SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM {self.TABLE_NAME}"
        params = []

        if month:
            base_sql += " WHERE month = ?"
            params.append(month)

        total_result = self.db.fetch_one(base_sql, tuple(params) if params else None)

        paid_sql = base_sql + " AND status = 'paid'" if month else base_sql + " WHERE status = 'paid'"
        paid_params = params + ['paid'] if month else ['paid']
        paid_result = self.db.fetch_one(paid_sql, tuple(paid_params))

        unpaid_sql = base_sql + " AND status = 'unpaid'" if month else base_sql + " WHERE status = 'unpaid'"
        unpaid_params = params + ['unpaid'] if month else ['unpaid']
        unpaid_result = self.db.fetch_one(unpaid_sql, tuple(unpaid_params))

        return {
            'total_count': total_result['total'] if total_result else 0,
            'total_amount': total_result['total_amount'] if total_result else 0,
            'paid_count': paid_result['total'] if paid_result else 0,
            'paid_amount': paid_result['total_amount'] if paid_result else 0,
            'unpaid_count': unpaid_result['total'] if unpaid_result else 0,
            'unpaid_amount': unpaid_result['total_amount'] if unpaid_result else 0
        }
