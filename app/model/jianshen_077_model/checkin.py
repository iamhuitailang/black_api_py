from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'tb_jianshen_077_model_checkin'

    STATUS_CHECKED_IN = 0
    STATUS_COMPLETED = 1

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
                booking_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                checkin_time TIMESTAMP,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_booking_id ON {cls.TABLE_NAME}(booking_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, booking_id: int, course_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'booking_id': booking_id,
            'course_id': course_id,
            'checkin_time': now,
            'status': self.STATUS_CHECKED_IN,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_booking(self, booking_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'booking_id': booking_id})

    def get_by_user_and_course(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'course_id': course_id})

    def update_status(self, checkin_id: int, status: int) -> int:
        data = {
            'status': status
        }
        return self.exec.update_by_id(checkin_id, data)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
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
            where_clauses.append("ck.status = ?")
            params.append(status)

        where_clauses.append("(u.nickname LIKE ? OR u.username LIKE ? OR c.title LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"""
            SELECT COUNT(*) as total 
            FROM {self.TABLE_NAME} ck
            LEFT JOIN tb_jianshen_077_model_user u ON ck.user_id = u.id
            LEFT JOIN tb_jianshen_077_model_course c ON ck.course_id = c.id
            WHERE {' AND '.join(where_clauses)}
        """
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT ck.*, u.nickname as user_nickname, u.username as user_username,
                   c.title as course_title, c.start_time as course_start_time,
                   c.coach as course_coach
            FROM {self.TABLE_NAME} ck
            LEFT JOIN tb_jianshen_077_model_user u ON ck.user_id = u.id
            LEFT JOIN tb_jianshen_077_model_course c ON ck.course_id = c.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY ck.created_at DESC
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
            self.STATUS_CHECKED_IN: '已签到',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def to_dict(self, checkin: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': checkin.get('id'),
            'user_id': checkin.get('user_id'),
            'booking_id': checkin.get('booking_id'),
            'course_id': checkin.get('course_id'),
            'checkin_time': checkin.get('checkin_time'),
            'status': checkin.get('status'),
            'status_text': self.get_status_text(checkin.get('status')),
            'user_nickname': checkin.get('user_nickname', ''),
            'user_username': checkin.get('user_username', ''),
            'course_title': checkin.get('course_title', ''),
            'course_start_time': checkin.get('course_start_time', ''),
            'course_coach': checkin.get('course_coach', ''),
            'created_at': checkin.get('created_at')
        }

    def count_by_course(self, course_id: int) -> int:
        return self.query.count({'course_id': course_id})

    def count_by_user(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def count_all(self) -> int:
        return self.query.count()
