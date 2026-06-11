from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderItemModel:
    TABLE_NAME = 'order_items'

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
                order_id INTEGER NOT NULL,
                dish_id INTEGER NOT NULL,
                dish_name TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (dish_id) REFERENCES dishes(id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dish_id ON {cls.TABLE_NAME}(dish_id)"
        db.execute(index_sql2)

    @classmethod
    def migrate_add_price_columns(cls):
        db = get_db()
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN price REAL DEFAULT 0")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN dish_name TEXT DEFAULT ''")
        except Exception:
            pass
        db.execute(f"""
            UPDATE {cls.TABLE_NAME} SET price = (
                SELECT d.price FROM dishes d WHERE d.id = {cls.TABLE_NAME}.dish_id
            ) WHERE price = 0 OR price IS NULL
        """)
        db.execute(f"""
            UPDATE {cls.TABLE_NAME} SET dish_name = (
                SELECT d.name FROM dishes d WHERE d.id = {cls.TABLE_NAME}.dish_id
            ) WHERE dish_name = '' OR dish_name IS NULL
        """)

    def create(self, order_id: int, dish_id: int, dish_name: str, price: float, quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'dish_id': dish_id,
            'dish_name': dish_name,
            'price': price,
            'quantity': quantity,
            'created_at': now
        }
        return self.exec.insert(data)

    def create_many(self, items: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for item in items:
            data_list.append({
                'order_id': item['order_id'],
                'dish_id': item['dish_id'],
                'dish_name': item['dish_name'],
                'price': item['price'],
                'quantity': item['quantity'],
                'created_at': now
            })
        return self.exec.insert_many(data_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT oi.id, oi.order_id, oi.dish_id, oi.dish_name, oi.price, oi.quantity, oi.created_at,
                   d.category, d.description, d.spicy_level, d.image_url
            FROM {self.TABLE_NAME} oi
            LEFT JOIN dishes d ON oi.dish_id = d.id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        """
        return self.db.fetch_all(sql, (order_id,))

    def get_all(self, order_id: int = None, dish_id: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if order_id is not None:
            conditions['order_id'] = order_id
        if dish_id is not None:
            conditions['dish_id'] = dish_id
        return self.query.find_all(conditions, order_by='id DESC')

    def update(self, record_id: int, quantity: int) -> int:
        data = {'quantity': quantity}
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_order_id(self, order_id: int) -> int:
        return self.exec.delete({'order_id': order_id})

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
