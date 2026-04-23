from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ProductModel:
    TABLE_NAME = 'tb_mudan_product'
    
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
                price REAL DEFAULT 0.0,
                quantity INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)

    def create(self, name: str, price: float = 0.0, quantity: int = 0, 
               description: str = '', image_url: str = '', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'price': price,
            'quantity': quantity,
            'description': description,
            'image_url': image_url,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, name: str = None, price: float = None, 
               quantity: int = None, description: str = None, image_url: str = None,
               sort_order: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if name is not None:
            data['name'] = name
        if price is not None:
            data['price'] = price
        if quantity is not None:
            data['quantity'] = quantity
        if description is not None:
            data['description'] = description
        if image_url is not None:
            data['image_url'] = image_url
        if sort_order is not None:
            data['sort_order'] = sort_order
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def count(self) -> int:
        return self.query.count()

    def create_many(self, products: List[Dict[str, Any]]) -> int:
        if not products:
            return 0
        
        now = datetime.now().isoformat()
        data_list = []
        for product in products:
            data_list.append({
                'name': product.get('name', ''),
                'price': product.get('price', 0.0),
                'quantity': product.get('quantity', 0),
                'description': product.get('description', ''),
                'image_url': product.get('image_url', ''),
                'sort_order': product.get('sort_order', 0),
                'created_at': now,
                'updated_at': now
            })
        
        return self.exec.insert_many(data_list)
