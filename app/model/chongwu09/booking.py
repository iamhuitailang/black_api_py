from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BookingModel:
    TABLE_NAME = 'tb_chongwu09_model_booking'

    STATUS_PENDING = 0
    STATUS_CONFIRMED = 1
    STATUS_ACTIVE = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4

    STATUS_MAP = {
        STATUS_PENDING: '待确认',
        STATUS_CONFIRMED: '已确认',
        STATUS_ACTIVE: '寄养中',
        STATUS_COMPLETED: '已完成',
        STATUS_CANCELLED: '已取消'
    }

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
                user_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                pet_id INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                notes TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                admin_notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_service_id ON {cls.TABLE_NAME}(service_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_pet_id ON {cls.TABLE_NAME}(pet_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, service_id: int, pet_id: int,
               start_date: str, end_date: str, notes: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'service_id': service_id,
            'pet_id': pet_id,
            'start_date': start_date,
            'end_date': end_date,
            'notes': notes,
            'status': self.STATUS_PENDING,
            'admin_notes': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, booking_id: int, status: int, admin_notes: str = '') -> int:
        now = datetime.now().isoformat()
        data = {'status': status, 'updated_at': now}
        if admin_notes:
            data['admin_notes'] = admin_notes
        return self.exec.update_by_id(booking_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                service_id: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if service_id:
            conditions['service_id'] = service_id
        if keyword:
            return self.search(keyword, page, page_size, status, service_id)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, service_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if service_id:
            where_clauses.append("service_id = ?")
            params.append(service_id)
        where_clauses.append("(notes LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)
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

    def get_status_text(self, status: int) -> str:
        return self.STATUS_MAP.get(status, '未知')

    def to_dict(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': booking.get('id'),
            'user_id': booking.get('user_id'),
            'service_id': booking.get('service_id'),
            'pet_id': booking.get('pet_id'),
            'start_date': booking.get('start_date'),
            'end_date': booking.get('end_date'),
            'notes': booking.get('notes'),
            'status': booking.get('status'),
            'status_text': self.get_status_text(booking.get('status')),
            'admin_notes': booking.get('admin_notes'),
            'created_at': booking.get('created_at'),
            'updated_at': booking.get('updated_at')
        }
