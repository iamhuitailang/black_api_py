from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class ShowtimeModel:
    TABLE_NAME = 'tb_movie_showtime'

    STATUS_ACTIVE = 0
    STATUS_SOLD_OUT = 1
    STATUS_CANCELLED = 2

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
                movie_id INTEGER NOT NULL,
                hall_name TEXT NOT NULL,
                show_date TEXT NOT NULL,
                show_time TEXT NOT NULL,
                price REAL NOT NULL DEFAULT 0,
                total_seats INTEGER NOT NULL DEFAULT 0,
                available_seats INTEGER NOT NULL DEFAULT 0,
                seat_layout TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_movie_id ON {cls.TABLE_NAME}(movie_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_show_date ON {cls.TABLE_NAME}(show_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, movie_id: int, hall_name: str, show_date: str,
               show_time: str, price: float, total_seats: int = 80,
               seat_layout: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'movie_id': movie_id,
            'hall_name': hall_name,
            'show_date': show_date,
            'show_time': show_time,
            'price': price,
            'total_seats': total_seats,
            'available_seats': total_seats,
            'seat_layout': seat_layout,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'movie_id', 'hall_name', 'show_date', 'show_time',
            'price', 'total_seats', 'available_seats', 'seat_layout', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_movie_id(self, movie_id: int, show_date: str = None) -> List[Dict[str, Any]]:
        conditions = {'movie_id': movie_id}
        if show_date:
            conditions['show_date'] = show_date
        return self.query.find_all(conditions, order_by='show_date ASC, show_time ASC')

    def get_all(self, page: int = 1, page_size: int = 10, movie_id: int = None,
                show_date: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if movie_id is not None:
            conditions['movie_id'] = movie_id
        if show_date:
            conditions['show_date'] = show_date
        if status is not None:
            conditions['status'] = status

        return self.query.paginate(page, page_size, conditions, order_by='show_date DESC, show_time DESC')

    def update_available_seats(self, record_id: int, delta: int) -> int:
        showtime = self.get_by_id(record_id)
        if not showtime:
            return 0

        current_available = showtime.get('available_seats', 0)
        new_available = max(0, min(showtime.get('total_seats', 0), current_available + delta))

        now = datetime.now().isoformat()
        data = {
            'available_seats': new_available,
            'updated_at': now
        }

        if new_available == 0:
            data['status'] = self.STATUS_SOLD_OUT

        return self.exec.update_by_id(record_id, data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def count_showtimes(self, movie_id: int = None) -> int:
        conditions = {}
        if movie_id is not None:
            conditions['movie_id'] = movie_id
        return self.query.count(conditions)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '开售中',
            self.STATUS_SOLD_OUT: '已售罄',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')