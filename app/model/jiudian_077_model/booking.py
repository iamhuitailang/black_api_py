from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BookingModel:
    TABLE_NAME = 'tb_jiudian_077_model_booking'

    STATUS_PENDING = 0
    STATUS_CONFIRMED = 1
    STATUS_CHECKED_IN = 2
    STATUS_CHECKED_OUT = 3
    STATUS_CANCELLED = 4

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
                booking_no TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                check_in_date TEXT NOT NULL,
                check_out_date TEXT NOT NULL,
                guest_name TEXT NOT NULL,
                guest_phone TEXT NOT NULL,
                guest_id_card TEXT DEFAULT '',
                guests_count INTEGER DEFAULT 1,
                total_price REAL NOT NULL,
                status INTEGER DEFAULT 0,
                remark TEXT DEFAULT '',
                check_in_time TIMESTAMP,
                check_out_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_booking_no ON {cls.TABLE_NAME}(booking_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_id ON {cls.TABLE_NAME}(room_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_dates ON {cls.TABLE_NAME}(check_in_date, check_out_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def _generate_booking_no(self) -> str:
        now = datetime.now()
        date_str = now.strftime('%Y%m%d%H%M%S')
        import random
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        return f"BK{date_str}{suffix}"

    def create(self, user_id: int, room_id: int, check_in_date: str, check_out_date: str,
               guest_name: str, guest_phone: str, guest_id_card: str = '',
               guests_count: int = 1, total_price: float = 0, remark: str = '') -> int:
        booking_no = self._generate_booking_no()
        now = datetime.now().isoformat()
        data = {
            'booking_no': booking_no,
            'user_id': user_id,
            'room_id': room_id,
            'check_in_date': check_in_date,
            'check_out_date': check_out_date,
            'guest_name': guest_name,
            'guest_phone': guest_phone,
            'guest_id_card': guest_id_card,
            'guests_count': guests_count,
            'total_price': total_price,
            'status': self.STATUS_PENDING,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_booking_no(self, booking_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'booking_no': booking_no})

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                user_id: int = None, room_id: int = None,
                start_date: str = None, end_date: str = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if user_id:
            conditions['user_id'] = user_id
        if room_id:
            conditions['room_id'] = room_id

        if keyword or start_date or end_date:
            return self.search(keyword or '', page, page_size, status, user_id, room_id, start_date, end_date)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, user_id: int = None, room_id: int = None,
               start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if room_id:
            where_clauses.append("room_id = ?")
            params.append(room_id)

        if start_date:
            where_clauses.append("check_in_date >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("check_out_date <= ?")
            params.append(end_date)

        if keyword:
            where_clauses.append("(booking_no LIKE ? OR guest_name LIKE ? OR guest_phone LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern])

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

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def check_in(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CHECKED_IN,
            'check_in_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def check_out(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CHECKED_OUT,
            'check_out_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def cancel(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CANCELLED)

    def confirm(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CONFIRMED)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def is_room_available(self, room_id: int, check_in_date: str, check_out_date: str,
                          exclude_booking_id: int = None) -> bool:
        where_clauses = [
            "room_id = ?",
            "status NOT IN (?, ?)",
            "check_in_date < ?",
            "check_out_date > ?"
        ]
        params = [room_id, self.STATUS_CANCELLED, self.STATUS_CHECKED_OUT, check_out_date, check_in_date]

        if exclude_booking_id:
            where_clauses.append("id != ?")
            params.append(exclude_booking_id)

        sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        result = self.db.fetch_one(sql, tuple(params))
        return result and result['cnt'] == 0

    def get_booked_room_ids(self, check_in_date: str, check_out_date: str) -> List[int]:
        where_clauses = [
            "status NOT IN (?, ?)",
            "check_in_date < ?",
            "check_out_date > ?"
        ]
        params = [self.STATUS_CANCELLED, self.STATUS_CHECKED_OUT, check_out_date, check_in_date]

        sql = f"SELECT DISTINCT room_id FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        results = self.db.fetch_all(sql, tuple(params))
        return [r['room_id'] for r in results]

    def get_statistics(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if start_date:
            where_clauses.append("DATE(b.created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(b.created_at) <= ?")
            params.append(end_date)

        total_bookings_sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}"
        total_bookings = self.db.fetch_one(total_bookings_sql, tuple(params))

        confirmed_sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} b WHERE status = 1 AND {' AND '.join(where_clauses)}"
        confirmed = self.db.fetch_one(confirmed_sql, tuple(params))

        revenue_sql = f"SELECT COALESCE(SUM(total_price), 0) as total FROM {self.TABLE_NAME} b WHERE status IN (2, 3) AND {' AND '.join(where_clauses)}"
        revenue = self.db.fetch_one(revenue_sql, tuple(params))

        daily_sql = f"""
            SELECT DATE(b.created_at) as date, COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue
            FROM {self.TABLE_NAME} b
            WHERE {' AND '.join(where_clauses)}
            GROUP BY DATE(b.created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        daily_stats = self.db.fetch_all(daily_sql, tuple(params))

        room_type_sql = f"""
            SELECT r.type as room_type, COUNT(*) as count
            FROM {self.TABLE_NAME} b
            JOIN tb_jiudian_077_model_room r ON b.room_id = r.id
            WHERE {' AND '.join(where_clauses)}
            GROUP BY r.type
        """
        room_type_stats = self.db.fetch_all(room_type_sql, tuple(params))

        return {
            'total_bookings': total_bookings['cnt'] if total_bookings else 0,
            'confirmed_bookings': confirmed['cnt'] if confirmed else 0,
            'total_revenue': revenue['total'] if revenue else 0,
            'daily_stats': daily_stats,
            'room_type_stats': room_type_stats
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_CONFIRMED: '已确认',
            self.STATUS_CHECKED_IN: '已入住',
            self.STATUS_CHECKED_OUT: '已退房',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.jiudian_077_model import RoomModel, UserModel
        room_model = RoomModel()
        user_model = UserModel()

        room = room_model.get_by_id(booking.get('room_id'))
        user = user_model.get_by_id(booking.get('user_id'))

        return {
            'id': booking.get('id'),
            'booking_no': booking.get('booking_no'),
            'user_id': booking.get('user_id'),
            'user': user_model.to_public_dict(user) if user else None,
            'room_id': booking.get('room_id'),
            'room': room_model.to_public_dict(room) if room else None,
            'check_in_date': booking.get('check_in_date'),
            'check_out_date': booking.get('check_out_date'),
            'guest_name': booking.get('guest_name'),
            'guest_phone': booking.get('guest_phone'),
            'guest_id_card': booking.get('guest_id_card'),
            'guests_count': booking.get('guests_count'),
            'total_price': booking.get('total_price'),
            'status': booking.get('status'),
            'status_text': self.get_status_text(booking.get('status')),
            'remark': booking.get('remark'),
            'check_in_time': booking.get('check_in_time'),
            'check_out_time': booking.get('check_out_time'),
            'created_at': booking.get('created_at')
        }
