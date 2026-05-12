from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OrderDetailModel:
    TABLE_NAME = 'tb_order_order_details'

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
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dish_id ON {cls.TABLE_NAME}(dish_id)"
        db.execute(index_sql)

    def create(self, order_id: int, dish_id: int, quantity: int,
               price: float, remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'dish_id': dish_id,
            'quantity': quantity,
            'price': price,
            'remark': remark,
            'created_at': now
        }
        return self.exec.insert(data)

    def batch_create(self, order_id: int, details: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for detail in details:
            data_list.append({
                'order_id': order_id,
                'dish_id': detail['dish_id'],
                'quantity': detail['quantity'],
                'price': detail['price'],
                'remark': detail.get('remark', ''),
                'created_at': now
            })
        if data_list:
            return self.exec.insert_many(data_list)
        return 0

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'order_id': order_id}, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'quantity', 'price', 'remark'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_order_id(self, order_id: int) -> int:
        return self.exec.delete({'order_id': order_id})

    def get_all(self, page: int = 1, page_size: int = 10, order_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if order_id:
            conditions['order_id'] = order_id
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')