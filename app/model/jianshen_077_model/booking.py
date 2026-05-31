from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BookingModel:
    TABLE_NAME = 'tb_jianshen_077_model_booking'

    STATUS_PENDING = 0
    STATUS_CONFIRMED = 1
    STATUS_CANCELLED = 2
    STATUS_COMPLETED = 3

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
                course_id INTEGER NOT NULL,
                status INTEGER DEFAULT 0,
                remark TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_course ON {cls.TABLE_NAME}(user_id, course_id)"
        db.execute(index_sql)

    def create(self, user_id: int, course_id: int, remark: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'course_id': course_id,
            'status': self.STATUS_CONFIRMED,
            'remark': remark,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_course(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'course_id': course_id})

    def get_active_booking(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND course_id = ? AND status IN (?, ?)"
        return self.db.fetch_one(sql, (user_id, course_id, self.STATUS_PENDING, self.STATUS_CONFIRMED))

    def update_status(self, booking_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(booking_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_course(self, course_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        conditions = {'course_id': course_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("b.status = ?")
            params.append(status)
        else:
            where_clauses.append("1=1")

        where_clauses.append("(u.nickname LIKE ? OR u.username LIKE ? OR c.title LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"""
            SELECT COUNT(*) as total 
            FROM {self.TABLE_NAME} b
            LEFT JOIN tb_jianshen_077_model_user u ON b.user_id = u.id
            LEFT JOIN tb_jianshen_077_model_course c ON b.course_id = c.id
            WHERE {' AND '.join(where_clauses)}
        """
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT b.*, u.nickname as user_nickname, u.username as user_username,
                   c.title as course_title, c.start_time as course_start_time,
                   c.end_time as course_end_time, c.coach as course_coach
            FROM {self.TABLE_NAME} b
            LEFT JOIN tb_jianshen_077_model_user u ON b.user_id = u.id
            LEFT JOIN tb_jianshen_077_model_course c ON b.course_id = c.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY b.created_at DESC
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
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_CONFIRMED: '已确认',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_dict(self, booking: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': booking.get('id'),
            'user_id': booking.get('user_id'),
            'course_id': booking.get('course_id'),
            'status': booking.get('status'),
            'status_text': self.get_status_text(booking.get('status')),
            'remark': booking.get('remark'),
            'user_nickname': booking.get('user_nickname', ''),
            'user_username': booking.get('user_username', ''),
            'course_title': booking.get('course_title', ''),
            'course_start_time': booking.get('course_start_time', ''),
            'course_end_time': booking.get('course_end_time', ''),
            'course_coach': booking.get('course_coach', ''),
            'created_at': booking.get('created_at'),
            'updated_at': booking.get('updated_at')
        }

    def count_by_course(self, course_id: int, status: int = None) -> int:
        conditions = {'course_id': course_id}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)

    def count_by_user(self, user_id: int, status: int = None) -> int:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.count(conditions)
