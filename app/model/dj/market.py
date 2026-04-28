from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MarketModel:
    TABLE_NAME = 'tb_dj_market'

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
                location TEXT,
                lunar_dates TEXT,
                solar_dates TEXT,
                open_time TEXT,
                close_time TEXT,
                scale TEXT,
                hot INTEGER DEFAULT 0,
                booth_count INTEGER DEFAULT 0,
                rating REAL DEFAULT 0.0,
                rating_count INTEGER DEFAULT 0,
                admin_phone TEXT,
                description TEXT,
                images TEXT,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'name': data.get('name'),
            'location': data.get('location'),
            'lunar_dates': data.get('lunar_dates'),
            'solar_dates': data.get('solar_dates'),
            'open_time': data.get('open_time'),
            'close_time': data.get('close_time'),
            'scale': data.get('scale'),
            'hot': data.get('hot', 0),
            'booth_count': data.get('booth_count', 0),
            'rating': data.get('rating', 0.0),
            'rating_count': data.get('rating_count', 0),
            'admin_phone': data.get('admin_phone'),
            'description': data.get('description'),
            'images': data.get('images'),
            'status': data.get('status', 1),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {**data, 'updated_at': now}
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def update_rating(self, record_id: int, rating: float) -> int:
        market = self.get_by_id(record_id)
        if not market:
            return 0
        current_rating = market.get('rating', 0.0)
        current_count = market.get('rating_count', 0)
        new_count = current_count + 1
        new_rating = (current_rating * current_count + rating) / new_count
        return self.update(record_id, {'rating': round(new_rating, 1), 'rating_count': new_count})

    def increment_hot(self, record_id: int) -> int:
        market = self.get_by_id(record_id)
        if not market:
            return 0
        new_hot = market.get('hot', 0) + 1
        return self.update(record_id, {'hot': new_hot})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='hot DESC, id DESC')

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None):
        return self.query.paginate(page, page_size, conditions, order_by='hot DESC, id DESC')

    def search_by_name(self, keyword: str, status: int = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE name LIKE ?"
        params = [f'%{keyword}%']
        if status is not None:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY hot DESC, id DESC"
        return self.db.fetch_all(sql, tuple(params))

    def get_hot_markets(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': 1}, order_by='hot DESC', limit=limit)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)
