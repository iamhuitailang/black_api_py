from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ParkingSpotModel:
    TABLE_NAME = 'parking_spot'

    STATUS_AVAILABLE = 'available'
    STATUS_OCCUPIED = 'occupied'
    STATUS_MAINTENANCE = 'maintenance'

    TYPE_STANDARD = 'standard'
    TYPE_LARGE = 'large'
    TYPE_EV = 'ev'

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
                spot_number TEXT NOT NULL UNIQUE,
                spot_type TEXT NOT NULL DEFAULT 'standard',
                status TEXT NOT NULL DEFAULT 'available',
                location TEXT,
                monthly_fee REAL NOT NULL DEFAULT 300,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(spot_type)"
        db.execute(index_sql2)

    @classmethod
    def seed_initial_data(cls):
        model = cls()
        count = model.query.count()
        if count > 0:
            return

        spots = []
        for i in range(1, 21):
            spots.append({
                'spot_number': f'A{i:03d}',
                'spot_type': cls.TYPE_STANDARD,
                'status': cls.STATUS_AVAILABLE,
                'location': 'A区',
                'monthly_fee': 300
            })
        for i in range(1, 11):
            spots.append({
                'spot_number': f'B{i:03d}',
                'spot_type': cls.TYPE_LARGE,
                'status': cls.STATUS_AVAILABLE,
                'location': 'B区',
                'monthly_fee': 450
            })
        for i in range(1, 11):
            spots.append({
                'spot_number': f'C{i:03d}',
                'spot_type': cls.TYPE_EV,
                'status': cls.STATUS_AVAILABLE,
                'location': 'C区',
                'monthly_fee': 350
            })

        for spot in spots:
            now = datetime.now().isoformat()
            spot['created_at'] = now
            spot['updated_at'] = now
            model.exec.insert(spot)

    def create(self, spot_number: str, spot_type: str, location: str = None, monthly_fee: float = 300) -> int:
        now = datetime.now().isoformat()
        data = {
            'spot_number': spot_number,
            'spot_type': spot_type,
            'status': self.STATUS_AVAILABLE,
            'location': location,
            'monthly_fee': monthly_fee,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_number(self, spot_number: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'spot_number': spot_number})

    def get_all(self, status: str = None, spot_type: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        if spot_type:
            conditions['spot_type'] = spot_type
        return self.query.find_all(conditions, order_by='spot_number ASC', limit=limit)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: str = None, spot_type: str = None) -> int:
        conditions = {}
        if status:
            conditions['status'] = status
        if spot_type:
            conditions['spot_type'] = spot_type
        return self.query.count(conditions)

    def paginate(self, page: int = 1, page_size: int = 10, status: str = None, spot_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status
        if spot_type:
            conditions['spot_type'] = spot_type
        return self.query.paginate(page, page_size, conditions, order_by='spot_number ASC')

    def update_status(self, record_id: int, status: str) -> int:
        return self.update(record_id, status=status)
