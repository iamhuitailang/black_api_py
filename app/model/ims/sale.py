from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SaleModel:
    TABLE_NAME = 'tb_ims_sale'

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
                variety_id INTEGER NOT NULL,
                variety_name TEXT NOT NULL,
                unit_price REAL NOT NULL DEFAULT 0.0,
                quantity INTEGER NOT NULL DEFAULT 0,
                total_price REAL NOT NULL DEFAULT 0.0,
                sale_location TEXT DEFAULT '',
                customer_id INTEGER DEFAULT 0,
                customer_name TEXT DEFAULT '',
                sale_date TEXT NOT NULL,
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_variety = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_variety ON {cls.TABLE_NAME}(variety_id)"
        db.execute(index_variety)

        index_date = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(sale_date)"
        db.execute(index_date)

        index_customer = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_customer ON {cls.TABLE_NAME}(customer_id)"
        db.execute(index_customer)

    def create(self, variety_id: int, variety_name: str, unit_price: float, quantity: int,
               sale_location: str = '', customer_id: int = 0, customer_name: str = '',
               sale_date: str = None, remark: str = '') -> int:
        now = datetime.now().isoformat()
        if sale_date is None:
            sale_date = date.today().isoformat()
        total_price = unit_price * quantity
        data = {
            'variety_id': variety_id,
            'variety_name': variety_name,
            'unit_price': unit_price,
            'quantity': quantity,
            'total_price': total_price,
            'sale_location': sale_location,
            'customer_id': customer_id,
            'customer_name': customer_name,
            'sale_date': sale_date,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sale_date DESC, id DESC')

    def get_by_date(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE sale_date >= ? AND sale_date <= ?
            ORDER BY sale_date DESC, id DESC
        """
        return self.db.fetch_all(sql, (start_date, end_date))

    def get_by_variety(self, variety_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'variety_id': variety_id}, order_by='sale_date DESC, id DESC')

    def update(self, record_id: int, variety_id: int = None, variety_name: str = None,
               unit_price: float = None, quantity: int = None, sale_location: str = None,
               customer_id: int = None, customer_name: str = None, sale_date: str = None,
               remark: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if variety_id is not None:
            data['variety_id'] = variety_id
        if variety_name is not None:
            data['variety_name'] = variety_name
        if unit_price is not None:
            data['unit_price'] = unit_price
        if quantity is not None:
            data['quantity'] = quantity
        if sale_location is not None:
            data['sale_location'] = sale_location
        if customer_id is not None:
            data['customer_id'] = customer_id
        if customer_name is not None:
            data['customer_name'] = customer_name
        if sale_date is not None:
            data['sale_date'] = sale_date
        if remark is not None:
            data['remark'] = remark

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def count_by_date(self, date_str: str) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE sale_date = ?"
        result = self.db.fetch_one(sql, (date_str,))
        return result['total'] if result else 0

    def get_total_amount_by_date(self, date_str: str) -> float:
        sql = f"SELECT SUM(total_price) as total FROM {self.TABLE_NAME} WHERE sale_date = ?"
        result = self.db.fetch_one(sql, (date_str,))
        return result['total'] if result and result['total'] else 0.0

    def get_total_amount_by_range(self, start_date: str, end_date: str) -> float:
        sql = f"SELECT SUM(total_price) as total FROM {self.TABLE_NAME} WHERE sale_date >= ? AND sale_date <= ?"
        result = self.db.fetch_one(sql, (start_date, end_date))
        return result['total'] if result and result['total'] else 0.0

    def get_total_quantity_by_range(self, start_date: str, end_date: str) -> int:
        sql = f"SELECT SUM(quantity) as total FROM {self.TABLE_NAME} WHERE sale_date >= ? AND sale_date <= ?"
        result = self.db.fetch_one(sql, (start_date, end_date))
        return result['total'] if result and result['total'] else 0

    def get_daily_stats(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                sale_date as date,
                COUNT(*) as count,
                SUM(total_price) as total_amount,
                SUM(quantity) as total_quantity
            FROM {self.TABLE_NAME}
            WHERE sale_date >= ? AND sale_date <= ?
            GROUP BY sale_date
            ORDER BY sale_date ASC
        """
        return self.db.fetch_all(sql, (start_date, end_date))

    def get_variety_stats(self, start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        
        if start_date:
            conditions.append("sale_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("sale_date <= ?")
            params.append(end_date)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        sql = f"""
            SELECT 
                variety_id,
                variety_name,
                COUNT(*) as count,
                SUM(total_price) as total_amount,
                SUM(quantity) as total_quantity
            FROM {self.TABLE_NAME}
            WHERE {where_clause}
            GROUP BY variety_id, variety_name
            ORDER BY total_amount DESC
        """
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def paginate(self, page: int = 1, page_size: int = 10,
                 variety_id: int = None, customer_id: int = None,
                 start_date: str = None, end_date: str = None,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = []
        params = []

        if variety_id is not None and variety_id > 0:
            conditions.append("variety_id = ?")
            params.append(variety_id)
        if customer_id is not None and customer_id > 0:
            conditions.append("customer_id = ?")
            params.append(customer_id)
        if start_date:
            conditions.append("sale_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("sale_date <= ?")
            params.append(end_date)
        if keyword:
            conditions.append("(variety_name LIKE ? OR customer_name LIKE ? OR sale_location LIKE ?)")
            keyword_param = f"%{keyword}%"
            params.extend([keyword_param, keyword_param, keyword_param])

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {where_clause}
            ORDER BY sale_date DESC, id DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"

        total = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total_count = total['total'] if total else 0
        items = self.db.fetch_all(sql, tuple(params) if params else None)

        return {
            'items': items,
            'total': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
