from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DishModel:
    TABLE_NAME = 'tb_order_dishes'

    STATUS_ON = 1
    STATUS_OFF = 0

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
                category_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                cost DECIMAL(10,2) DEFAULT 0,
                stock INTEGER DEFAULT 999,
                sold_count INTEGER DEFAULT 0,
                image_url TEXT DEFAULT '',
                description TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category_id ON {cls.TABLE_NAME}(category_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, category_id: int, name: str, price: float, cost: float = 0,
               stock: int = 999, image_url: str = '', description: str = '',
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'category_id': category_id,
            'name': name,
            'price': price,
            'cost': cost,
            'stock': stock,
            'sold_count': 0,
            'image_url': image_url,
            'description': description,
            'sort_order': sort_order,
            'status': self.STATUS_ON,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'category_id', 'name', 'price', 'cost', 'stock',
            'image_url', 'description', 'sort_order', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def increment_sold_count(self, record_id: int, quantity: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET sold_count = sold_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (quantity, record_id))
        return cursor.rowcount

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                category_id: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if category_id:
            conditions['category_id'] = category_id

        if keyword:
            return self.search(keyword, page, page_size, status, category_id)

        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, category_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if category_id:
            where_clauses.append("category_id = ?")
            params.append(category_id)

        where_clauses.append("name LIKE ?")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY sort_order ASC, id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_list(self, category_id: int = None) -> List[Dict[str, Any]]:
        conditions = {'status': self.STATUS_ON}
        if category_id:
            conditions['category_id'] = category_id
        result = self.query.find_all(conditions, order_by='sort_order ASC, id DESC')
        return result