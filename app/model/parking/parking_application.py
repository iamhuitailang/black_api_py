from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ParkingApplicationModel:
    TABLE_NAME = 'parking_application'

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_ASSIGNED = 'assigned'

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
                car_plate TEXT NOT NULL,
                applicant_name TEXT NOT NULL,
                applicant_phone TEXT NOT NULL,
                applicant_address TEXT,
                desired_spot_type TEXT NOT NULL DEFAULT 'standard',
                status TEXT NOT NULL DEFAULT 'pending',
                reject_reason TEXT,
                review_time TIMESTAMP,
                reviewer TEXT,
                spot_id INTEGER,
                start_date TEXT,
                end_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_car_plate ON {cls.TABLE_NAME}(car_plate)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_spot_id ON {cls.TABLE_NAME}(spot_id)"
        db.execute(index_sql3)

    def create(self, car_plate: str, applicant_name: str, applicant_phone: str,
               applicant_address: str = None, desired_spot_type: str = 'standard') -> int:
        now = datetime.now().isoformat()
        data = {
            'car_plate': car_plate,
            'applicant_name': applicant_name,
            'applicant_phone': applicant_phone,
            'applicant_address': applicant_address,
            'desired_spot_type': desired_spot_type,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_car_plate(self, car_plate: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'car_plate': car_plate}, order_by='id DESC')

    def get_latest_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'applicant_phone': phone}, order_by='id DESC')

    def get_all(self, status: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC', limit=limit)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: str = None) -> int:
        conditions = {}
        if status:
            conditions['status'] = status
        return self.query.count(conditions)

    def paginate(self, page: int = 1, page_size: int = 10, status: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status

        if keyword:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE car_plate LIKE ? OR applicant_name LIKE ? OR applicant_phone LIKE ?
            """
            params = [f'%{keyword}%', f'%{keyword}%', f'%{keyword}%']
            if status:
                sql += " AND status = ?"
                params.append(status)
            sql += " ORDER BY id DESC"

            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME}
                WHERE car_plate LIKE ? OR applicant_name LIKE ? OR applicant_phone LIKE ?
            """
            count_params = [f'%{keyword}%', f'%{keyword}%', f'%{keyword}%']
            if status:
                count_sql += " AND status = ?"
                count_params.append(status)

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

    def approve(self, record_id: int, reviewer: str = 'admin') -> int:
        now = datetime.now().isoformat()
        return self.update(
            record_id,
            status=self.STATUS_APPROVED,
            review_time=now,
            reviewer=reviewer
        )

    def reject(self, record_id: int, reject_reason: str, reviewer: str = 'admin') -> int:
        now = datetime.now().isoformat()
        return self.update(
            record_id,
            status=self.STATUS_REJECTED,
            reject_reason=reject_reason,
            review_time=now,
            reviewer=reviewer
        )

    def assign_spot(self, record_id: int, spot_id: int, start_date: str, end_date: str) -> int:
        return self.update(
            record_id,
            status=self.STATUS_ASSIGNED,
            spot_id=spot_id,
            start_date=start_date,
            end_date=end_date
        )
