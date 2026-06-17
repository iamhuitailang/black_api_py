from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FarmerModel:
    TABLE_NAME = 'tb_farm_farmer'

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    CERT_ORGANIC = 'organic'
    CERT_GREEN = 'green'
    CERT_POLLUTION_FREE = 'pollution_free'
    CERT_NONE = 'none'

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
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                password TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL,
                categories TEXT NOT NULL DEFAULT '',
                certification TEXT NOT NULL DEFAULT 'none',
                certification_desc TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                shop_name TEXT DEFAULT '',
                shop_description TEXT DEFAULT '',
                total_orders INTEGER DEFAULT 0,
                on_time_deliveries INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_phone ON {cls.TABLE_NAME}(phone)"
        db.execute(index_sql2)

    def create(self, name: str, phone: str, address: str, categories: str = '',
               certification: str = 'none', certification_desc: str = '',
               password: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'phone': phone,
            'password': password,
            'address': address,
            'categories': categories,
            'certification': certification,
            'certification_desc': certification_desc,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'phone': phone})

    def get_all(self, status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        if conditions:
            return self.query.find_all(conditions, order_by='id DESC')
        return self.query.find_all(order_by='id DESC')

    def get_approved(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_APPROVED}, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def approve(self, record_id: int) -> int:
        return self.update(record_id, status=self.STATUS_APPROVED)

    def reject(self, record_id: int) -> int:
        return self.update(record_id, status=self.STATUS_REJECTED)

    def update_shop(self, record_id: int, shop_name: str = None, shop_description: str = None) -> int:
        return self.update(record_id, shop_name=shop_name, shop_description=shop_description)

    def update_delivery_stats(self, record_id: int, is_on_time: bool) -> int:
        farmer = self.get_by_id(record_id)
        if not farmer:
            return 0
        total_orders = (farmer.get('total_orders') or 0) + 1
        on_time = (farmer.get('on_time_deliveries') or 0) + (1 if is_on_time else 0)
        return self.update(record_id, total_orders=total_orders, on_time_deliveries=on_time)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self, status: str = None) -> int:
        if status:
            return self.query.count({'status': status})
        return self.query.count()
