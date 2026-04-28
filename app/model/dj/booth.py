from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BoothModel:
    TABLE_NAME = 'tb_dj_booth'

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
                market_id INTEGER NOT NULL,
                vendor_name TEXT,
                phone TEXT,
                wechat TEXT,
                location_desc TEXT,
                categories TEXT,
                description TEXT,
                images TEXT,
                rating REAL DEFAULT 0.0,
                rating_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                is_verified INTEGER DEFAULT 0,
                user_id INTEGER,
                apply_status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                settled_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_market_id ON {cls.TABLE_NAME}(market_id)"
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql1)
        db.execute(index_sql2)
        db.execute(index_sql3)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'market_id': data.get('market_id'),
            'vendor_name': data.get('vendor_name'),
            'phone': data.get('phone'),
            'wechat': data.get('wechat'),
            'location_desc': data.get('location_desc'),
            'categories': data.get('categories'),
            'description': data.get('description'),
            'images': data.get('images'),
            'rating': data.get('rating', 0.0),
            'rating_count': data.get('rating_count', 0),
            'status': data.get('status', 1),
            'is_verified': data.get('is_verified', 0),
            'user_id': data.get('user_id'),
            'apply_status': data.get('apply_status', 0),
            'created_at': now,
            'updated_at': now,
            'settled_at': now if data.get('is_verified') else None
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('user_id', user_id, order_by='id DESC')

    def get_by_market_id(self, market_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('market_id', market_id, order_by='rating DESC, id DESC')

    def get_pending_applications(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'apply_status': 0}, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {**data, 'updated_at': now}
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def verify_booth(self, record_id: int, is_verified: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_verified': is_verified,
            'apply_status': 1 if is_verified else 2,
            'settled_at': now if is_verified else None,
            'updated_at': now
        }
        return self.update(record_id, data)

    def update_rating(self, record_id: int, rating: float) -> int:
        booth = self.get_by_id(record_id)
        if not booth:
            return 0
        current_rating = booth.get('rating', 0.0)
        current_count = booth.get('rating_count', 0)
        new_count = current_count + 1
        new_rating = (current_rating * current_count + rating) / new_count
        return self.update(record_id, {'rating': round(new_rating, 1), 'rating_count': new_count})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, conditions: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions, order_by='id DESC')

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
