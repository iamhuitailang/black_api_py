from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class InventoryModel:
    TABLE_NAME = 'tb_ims_inventory'

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
                variety_id INTEGER NOT NULL UNIQUE,
                variety_name TEXT NOT NULL,
                current_quantity INTEGER NOT NULL DEFAULT 0,
                purchase_location TEXT DEFAULT '',
                avg_cost_price REAL NOT NULL DEFAULT 0.0,
                total_cost REAL NOT NULL DEFAULT 0.0,
                warning_threshold INTEGER NOT NULL DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_variety = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_variety ON {cls.TABLE_NAME}(variety_id)"
        db.execute(index_variety)

        index_quantity = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_quantity ON {cls.TABLE_NAME}(current_quantity)"
        db.execute(index_quantity)

    def create(self, variety_id: int, variety_name: str, current_quantity: int = 0,
               purchase_location: str = '', avg_cost_price: float = 0.0,
               total_cost: float = 0.0, warning_threshold: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'variety_id': variety_id,
            'variety_name': variety_name,
            'current_quantity': current_quantity,
            'purchase_location': purchase_location,
            'avg_cost_price': avg_cost_price,
            'total_cost': total_cost,
            'warning_threshold': warning_threshold,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_variety(self, variety_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'variety_id': variety_id})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def get_warning_items(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE current_quantity <= warning_threshold
            ORDER BY current_quantity ASC, id DESC
        """
        return self.db.fetch_all(sql)

    def update(self, record_id: int, current_quantity: int = None,
               purchase_location: str = None, avg_cost_price: float = None,
               total_cost: float = None, warning_threshold: int = None,
               variety_name: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if current_quantity is not None:
            data['current_quantity'] = current_quantity
        if purchase_location is not None:
            data['purchase_location'] = purchase_location
        if avg_cost_price is not None:
            data['avg_cost_price'] = avg_cost_price
        if total_cost is not None:
            data['total_cost'] = total_cost
        if warning_threshold is not None:
            data['warning_threshold'] = warning_threshold
        if variety_name is not None:
            data['variety_name'] = variety_name

        return self.exec.update_by_id(record_id, data)

    def update_by_variety(self, variety_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = kwargs.copy()
        data['updated_at'] = now
        return self.exec.update(data, conditions={'variety_id': variety_id})

    def add_quantity(self, variety_id: int, quantity: int, cost_price: float = None) -> int:
        existing = self.get_by_variety(variety_id)
        if not existing:
            return 0

        new_quantity = existing['current_quantity'] + quantity
        new_total_cost = existing['total_cost']

        if cost_price is not None and cost_price > 0:
            new_total_cost += cost_price * quantity

        new_avg_price = 0.0
        if new_quantity > 0:
            new_avg_price = new_total_cost / new_quantity

        return self.update_by_variety(
            variety_id=variety_id,
            current_quantity=new_quantity,
            total_cost=new_total_cost,
            avg_cost_price=round(new_avg_price, 2)
        )

    def subtract_quantity(self, variety_id: int, quantity: int) -> int:
        existing = self.get_by_variety(variety_id)
        if not existing:
            return 0

        new_quantity = max(0, existing['current_quantity'] - quantity)
        return self.update_by_variety(
            variety_id=variety_id,
            current_quantity=new_quantity
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_variety(self, variety_id: int) -> int:
        return self.exec.delete(conditions={'variety_id': variety_id})

    def count(self) -> int:
        return self.query.count()

    def get_total_quantity(self) -> int:
        sql = f"SELECT SUM(current_quantity) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result['total'] if result and result['total'] else 0

    def get_total_cost(self) -> float:
        sql = f"SELECT SUM(total_cost) as total FROM {self.TABLE_NAME}"
        result = self.db.fetch_one(sql)
        return result['total'] if result and result['total'] else 0.0

    def get_variety_distribution(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                variety_id,
                variety_name,
                current_quantity,
                total_cost,
                avg_cost_price,
                warning_threshold,
                (current_quantity <= warning_threshold) as is_warning
            FROM {self.TABLE_NAME}
            ORDER BY current_quantity DESC
        """
        return self.db.fetch_all(sql)

    def paginate(self, page: int = 1, page_size: int = 10,
                 variety_id: int = None, show_warning: bool = False,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = []
        params = []

        if variety_id is not None and variety_id > 0:
            conditions.append("variety_id = ?")
            params.append(variety_id)
        if show_warning:
            conditions.append("current_quantity <= warning_threshold")
        if keyword:
            conditions.append("variety_name LIKE ?")
            keyword_param = f"%{keyword}%"
            params.append(keyword_param)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {where_clause}
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {where_clause}"

        total = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total_count = total['total'] if total else 0
        items = self.db.fetch_all(sql, tuple(params) if params else None)

        result_items = []
        for item in items:
            item_copy = item.copy()
            item_copy['is_warning'] = item['current_quantity'] <= item['warning_threshold']
            result_items.append(item_copy)

        return {
            'items': result_items,
            'total': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }

    def upsert(self, variety_id: int, variety_name: str, quantity: int,
               cost_price: float = None, purchase_location: str = None) -> int:
        existing = self.get_by_variety(variety_id)
        now = datetime.now().isoformat()

        if existing:
            new_quantity = existing['current_quantity'] + quantity
            new_total_cost = existing['total_cost']

            if cost_price is not None and cost_price > 0:
                new_total_cost += cost_price * quantity

            new_avg_price = 0.0
            if new_quantity > 0:
                new_avg_price = new_total_cost / new_quantity

            update_data = {
                'current_quantity': new_quantity,
                'total_cost': new_total_cost,
                'avg_cost_price': round(new_avg_price, 2),
                'updated_at': now
            }
            if variety_name:
                update_data['variety_name'] = variety_name
            if purchase_location:
                update_data['purchase_location'] = purchase_location

            return self.exec.update(update_data, conditions={'variety_id': variety_id})
        else:
            total_cost = (cost_price * quantity) if cost_price else 0.0
            avg_price = total_cost / quantity if quantity > 0 else 0.0

            data = {
                'variety_id': variety_id,
                'variety_name': variety_name,
                'current_quantity': quantity,
                'purchase_location': purchase_location or '',
                'avg_cost_price': round(avg_price, 2),
                'total_cost': total_cost,
                'warning_threshold': 10,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)
