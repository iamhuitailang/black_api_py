from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RideModel:
    TABLE_NAME = 'tb_rides'

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
                from_location TEXT NOT NULL,
                to_location TEXT NOT NULL,
                departure_time TEXT NOT NULL,
                weekdays INTEGER DEFAULT 0,
                seats INTEGER DEFAULT 1,
                available_seats INTEGER DEFAULT 1,
                contact TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        idx_from = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_from ON {cls.TABLE_NAME}(from_location)"
        idx_to = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_to ON {cls.TABLE_NAME}(to_location)"
        idx_status = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        idx_created = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(idx_from)
        db.execute(idx_to)
        db.execute(idx_status)
        db.execute(idx_created)

    def create(self, from_location: str, to_location: str, departure_time: str,
               weekdays: bool, seats: int, available_seats: int, contact: str,
               password_hash: str, remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'from_location': from_location,
            'to_location': to_location,
            'departure_time': departure_time,
            'weekdays': 1 if weekdays else 0,
            'seats': seats,
            'available_seats': available_seats,
            'contact': contact,
            'password_hash': password_hash,
            'status': 'active',
            'remark': remark,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, conditions: Dict[str, Any] = None,
                order_by: str = 'created_at DESC') -> List[Dict[str, Any]]:
        return self.query.find_all(conditions=conditions, order_by=order_by)

    def update_status(self, record_id: int, status: str) -> int:
        return self.exec.update_by_id(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def search(self, from_location: str = None, to_location: str = None,
               status: str = 'active') -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE 1=1"
        params = []

        if status:
            sql += " AND status = ?"
            params.append(status)
        if from_location:
            sql += " AND from_location LIKE ?"
            params.append(f"%{from_location}%")
        if to_location:
            sql += " AND to_location LIKE ?"
            params.append(f"%{to_location}%")

        sql += " ORDER BY weekdays DESC, departure_time ASC, created_at DESC"
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def delete_expired(self, expiry_hours: int = 24) -> int:
        sql = f"""
            DELETE FROM {self.TABLE_NAME}
            WHERE weekdays = 0
              AND created_at < datetime('now', '-{expiry_hours} hours')
        """
        return self.exec.execute_raw(sql)
