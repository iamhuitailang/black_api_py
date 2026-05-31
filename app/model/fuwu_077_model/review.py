from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_fuwu_077_model_review'

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
                user_id INTEGER NOT NULL,
                staff_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                rating INTEGER DEFAULT 5,
                content TEXT DEFAULT '',
                images TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_id ON {cls.TABLE_NAME}(order_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_staff_id ON {cls.TABLE_NAME}(staff_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_service_id ON {cls.TABLE_NAME}(service_id)"
        db.execute(index_sql)

    def create(self, order_id: int, user_id: int, staff_id: int, 
               service_id: int, rating: int = 5, 
               content: str = '', images: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'order_id': order_id,
            'user_id': user_id,
            'staff_id': staff_id,
            'service_id': service_id,
            'rating': rating,
            'content': content,
            'images': images,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_order_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'order_id': order_id})

    def get_by_user_id(self, user_id: int, page: int = 1, 
                       page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'user_id': user_id}, order_by='id DESC')

    def get_by_staff_id(self, staff_id: int, page: int = 1, 
                        page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'staff_id': staff_id}, order_by='id DESC')

    def get_by_service_id(self, service_id: int, page: int = 1, 
                          page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'service_id': service_id}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'rating', 'content', 'images'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, 
                staff_id: int = None, service_id: int = None,
                min_rating: int = None, max_rating: int = None) -> Dict[str, Any]:
        conditions = {}
        if staff_id:
            conditions['staff_id'] = staff_id
        if service_id:
            conditions['service_id'] = service_id

        if min_rating is not None or max_rating is not None:
            return self.search(page, page_size, staff_id, service_id, min_rating, max_rating)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, page: int = 1, page_size: int = 10,
               staff_id: int = None, service_id: int = None,
               min_rating: int = None, max_rating: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if staff_id:
            where_clauses.append("staff_id = ?")
            params.append(staff_id)

        if service_id:
            where_clauses.append("service_id = ?")
            params.append(service_id)

        if min_rating is not None:
            where_clauses.append("rating >= ?")
            params.append(min_rating)

        if max_rating is not None:
            where_clauses.append("rating <= ?")
            params.append(max_rating)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
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

    def get_staff_average_rating(self, staff_id: int) -> float:
        sql = f"SELECT AVG(rating) as avg_rating FROM {self.TABLE_NAME} WHERE staff_id = ?"
        result = self.db.fetch_one(sql, (staff_id,))
        return round(result['avg_rating'] or 5.0, 1) if result else 5.0

    def to_dict(self, review: Dict[str, Any], user: Dict[str, Any] = None, 
                staff: Dict[str, Any] = None, service: Dict[str, Any] = None) -> Dict[str, Any]:
        result = {
            'id': review.get('id'),
            'order_id': review.get('order_id'),
            'user_id': review.get('user_id'),
            'staff_id': review.get('staff_id'),
            'service_id': review.get('service_id'),
            'rating': review.get('rating'),
            'content': review.get('content'),
            'images': review.get('images'),
            'created_at': review.get('created_at'),
            'updated_at': review.get('updated_at')
        }
        
        if user:
            result['user'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar')
            }
        
        if staff:
            result['staff'] = {
                'id': staff.get('id'),
                'name': staff.get('name'),
                'avatar': staff.get('avatar')
            }
        
        if service:
            result['service'] = {
                'id': service.get('id'),
                'name': service.get('name')
            }
        
        return result
