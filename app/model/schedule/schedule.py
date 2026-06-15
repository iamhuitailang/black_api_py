from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScheduleModel:
    TABLE_NAME = 'schedules'

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
                staff_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                shift_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(staff_id, date)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_staff ON {cls.TABLE_NAME}(staff_id)"
        db.execute(index_sql2)

    def create(self, staff_id: int, date_str: str, shift_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'staff_id': staff_id,
            'date': date_str,
            'shift_id': shift_id,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def upsert(self, staff_id: int, date_str: str, shift_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'staff_id': staff_id,
            'date': date_str,
            'shift_id': shift_id,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.upsert(data, ['staff_id', 'date'])

    def get_by_id(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(schedule_id)

    def get_by_staff_and_date(self, staff_id: int, date_str: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'staff_id': staff_id, 'date': date_str})

    def get_by_staff_and_date_range(self, staff_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE staff_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
        return self.db.fetch_all(sql, (staff_id, start_date, end_date))

    def get_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE date >= ? AND date <= ? ORDER BY date ASC, staff_id ASC"
        return self.db.fetch_all(sql, (start_date, end_date))

    def get_all_by_date(self, date_str: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'date': date_str}, order_by='staff_id ASC')

    def update(self, schedule_id: int, shift_id: int) -> int:
        data = {
            'shift_id': shift_id,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(schedule_id, data)

    def update_by_staff_date(self, staff_id: int, date_str: str, shift_id: int) -> int:
        data = {
            'shift_id': shift_id,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update(data, {'staff_id': staff_id, 'date': date_str})

    def delete(self, schedule_id: int) -> int:
        return self.exec.delete_by_id(schedule_id)

    def delete_by_date_range(self, start_date: str, end_date: str) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE date >= ? AND date <= ?"
        cursor = self.db.execute(sql, (start_date, end_date))
        return cursor.rowcount

    def count(self) -> int:
        return self.query.count()

    def batch_create(self, schedules: List[Dict[str, Any]]) -> int:
        if not schedules:
            return 0
        now = datetime.now().isoformat()
        data_list = []
        for s in schedules:
            data_list.append({
                'staff_id': s['staff_id'],
                'date': s['date'],
                'shift_id': s['shift_id'],
                'created_at': now,
                'updated_at': now
            })
        return self.exec.insert_many(data_list)

    def swap_shifts(self, staff1_id: int, date1: str, staff2_id: int, date2: str) -> bool:
        try:
            with self.exec.transaction():
                s1 = self.get_by_staff_and_date(staff1_id, date1)
                s2 = self.get_by_staff_and_date(staff2_id, date2)

                if not s1 or not s2:
                    return False

                shift1_id = s1['shift_id']
                shift2_id = s2['shift_id']

                self.update_by_staff_date(staff1_id, date1, shift2_id)
                self.update_by_staff_date(staff2_id, date2, shift1_id)

            return True
        except Exception:
            return False
