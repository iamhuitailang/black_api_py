from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ParkingRecordModel:
    TABLE_NAME = 'tb_chifei_model_parking_record'

    STATUS_PARKING = 'parking'
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
                plate_number TEXT NOT NULL,
                vehicle_type_id INTEGER NOT NULL,
                vehicle_type_code TEXT NOT NULL,
                vehicle_type_name TEXT NOT NULL,
                rate_per_hour REAL NOT NULL DEFAULT 0,
                free_minutes INTEGER NOT NULL DEFAULT 0,
                daily_cap REAL NOT NULL DEFAULT 0,
                entry_time TIMESTAMP NOT NULL,
                exit_time TIMESTAMP,
                parking_duration INTEGER DEFAULT 0,
                billable_minutes INTEGER DEFAULT 0,
                total_fee REAL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'parking',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_plate_number ON {cls.TABLE_NAME}(plate_number)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_entry_time ON {cls.TABLE_NAME}(entry_time)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_exit_time ON {cls.TABLE_NAME}(exit_time)"
        db.execute(index_sql4)

    def create(self, plate_number: str, vehicle_type_id: int, vehicle_type_code: str,
               vehicle_type_name: str, rate_per_hour: float, free_minutes: int,
               daily_cap: float, entry_time: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'plate_number': plate_number,
            'vehicle_type_id': vehicle_type_id,
            'vehicle_type_code': vehicle_type_code,
            'vehicle_type_name': vehicle_type_name,
            'rate_per_hour': rate_per_hour,
            'free_minutes': free_minutes,
            'daily_cap': daily_cap,
            'entry_time': entry_time or now,
            'status': self.STATUS_PARKING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_parking_by_plate(self, plate_number: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'plate_number': plate_number,
            'status': self.STATUS_PARKING
        })

    def get_all_parking(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_PARKING},
            order_by='entry_time DESC'
        )

    def get_all_completed(self, start_date: str = None, end_date: str = None,
                          plate_number: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_COMPLETED}
        params = []
        where_clauses = ["status = ?"]
        params.append(self.STATUS_COMPLETED)

        if start_date:
            where_clauses.append("exit_time >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("exit_time <= ?")
            params.append(end_date)
        if plate_number:
            where_clauses.append("plate_number LIKE ?")
            params.append(f"%{plate_number}%")

        where_sql = " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_sql}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        offset = (page - 1) * page_size
        list_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {where_sql} 
            ORDER BY exit_time DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(list_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update_exit(self, record_id: int, exit_time: str, parking_duration: int,
                    billable_minutes: int, total_fee: float) -> int:
        now = datetime.now().isoformat()
        data = {
            'exit_time': exit_time,
            'parking_duration': parking_duration,
            'billable_minutes': billable_minutes,
            'total_fee': total_fee,
            'status': self.STATUS_COMPLETED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_parking(self) -> int:
        return self.query.count({'status': self.STATUS_PARKING})

    def get_today_statistics(self) -> Dict[str, Any]:
        today_start = datetime.now().strftime('%Y-%m-%d 00:00:00')
        today_end = datetime.now().strftime('%Y-%m-%d 23:59:59')

        sql = f"""
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_fee), 0) as total_income
            FROM {self.TABLE_NAME}
            WHERE status = ? 
            AND exit_time >= ? 
            AND exit_time <= ?
        """
        result = self.db.fetch_one(sql, (self.STATUS_COMPLETED, today_start, today_end))

        parking_count = self.count_parking()

        return {
            'current_parking': parking_count,
            'today_orders': result['total_orders'] if result else 0,
            'today_income': result['total_income'] if result else 0
        }

    def check_plate_parking(self, plate_number: str) -> bool:
        return self.query.exists({
            'plate_number': plate_number,
            'status': self.STATUS_PARKING
        })
