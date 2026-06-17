from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FarmProductModel:
    TABLE_NAME = 'tb_farm_product'

    UNIT_JIN = 'jin'
    UNIT_PORTION = 'portion'

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
                farmer_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL DEFAULT 0.0,
                unit TEXT NOT NULL DEFAULT 'jin',
                stock INTEGER NOT NULL DEFAULT 0,
                harvest_date TEXT NOT NULL,
                delivery_range TEXT NOT NULL DEFAULT '',
                expected_delivery TEXT NOT NULL DEFAULT '',
                description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                sold_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_farmer_id ON {cls.TABLE_NAME}(farmer_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql3)

    def create(self, farmer_id: int, name: str, category: str, price: float,
               unit: str = 'jin', stock: int = 0, harvest_date: str = '',
               delivery_range: str = '', expected_delivery: str = '',
               description: str = '', image_url: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'farmer_id': farmer_id,
            'name': name,
            'category': category,
            'price': price,
            'unit': unit,
            'stock': stock,
            'harvest_date': harvest_date,
            'delivery_range': delivery_range,
            'expected_delivery': expected_delivery,
            'description': description,
            'image_url': image_url,
            'is_active': 1,
            'sold_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_farmer(self, farmer_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'farmer_id': farmer_id}, order_by='id DESC')

    def get_all_active(self, category: str = None, delivery_range: str = None) -> List[Dict[str, Any]]:
        conditions = {'is_active': 1}
        results = self.query.find_all(conditions, order_by='id DESC')

        if category:
            results = [r for r in results if r.get('category') == category]
        if delivery_range:
            results = [r for r in results if delivery_range in (r.get('delivery_range') or '')]

        return results

    def get_categories(self) -> List[str]:
        sql = f"SELECT DISTINCT category FROM {self.TABLE_NAME} WHERE is_active = 1 AND category != ''"
        rows = self.db.fetch_all(sql)
        return [row['category'] for row in rows]

    def get_delivery_ranges(self) -> List[str]:
        sql = f"SELECT DISTINCT delivery_range FROM {self.TABLE_NAME} WHERE is_active = 1 AND delivery_range != ''"
        rows = self.db.fetch_all(sql)
        ranges = []
        for row in rows:
            for r in (row['delivery_range'] or '').split(','):
                r = r.strip()
                if r and r not in ranges:
                    ranges.append(r)
        return ranges

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def decrease_stock(self, record_id: int, quantity: int) -> int:
        product = self.get_by_id(record_id)
        if not product:
            return 0
        new_stock = max(0, (product.get('stock') or 0) - quantity)
        sold_count = (product.get('sold_count') or 0) + quantity
        return self.update(record_id, stock=new_stock, sold_count=sold_count)

    def set_active(self, record_id: int, is_active: bool) -> int:
        return self.update(record_id, is_active=1 if is_active else 0)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_sales_by_category(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT category, SUM(sold_count) as total_sold, COUNT(*) as product_count
            FROM {self.TABLE_NAME}
            GROUP BY category
            ORDER BY total_sold DESC
        """
        return self.db.fetch_all(sql)

    def count(self) -> int:
        return self.query.count({'is_active': 1})
