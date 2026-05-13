from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import uuid
import random
import string


class RegistrationModel:
    TABLE_NAME = 'tb_bm_registrations'

    STATUS_PENDING = 1
    STATUS_APPROVED = 2
    STATUS_REJECTED = 3
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
                registration_no TEXT NOT NULL UNIQUE,
                activity_id INTEGER NOT NULL,
                user_id INTEGER,
                real_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT DEFAULT '',
                remark TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                qrcode TEXT UNIQUE,
                checked_in INTEGER DEFAULT 0,
                checkin_time TIMESTAMP,
                cancelled_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_registration_no ON {cls.TABLE_NAME}(registration_no)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_qrcode ON {cls.TABLE_NAME}(qrcode)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def _generate_registration_no(self) -> str:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f'BM{timestamp}{random_str}'

    def _generate_qrcode(self) -> str:
        return str(uuid.uuid4()).replace('-', '')

    def create(self, activity_id: int, real_name: str, phone: str, email: str = '',
               remark: str = '', user_id: int = None, need_approval: bool = False) -> Dict[str, Any]:
        registration_no = self._generate_registration_no()
        qrcode = self._generate_qrcode()
        now = datetime.now().isoformat()

        status = self.STATUS_APPROVED if not need_approval else self.STATUS_PENDING

        data = {
            'registration_no': registration_no,
            'activity_id': activity_id,
            'user_id': user_id,
            'real_name': real_name,
            'phone': phone,
            'email': email,
            'remark': remark,
            'status': status,
            'qrcode': qrcode,
            'checked_in': 0,
            'created_at': now,
            'updated_at': now
        }
        record_id = self.exec.insert(data)
        return {
            'id': record_id,
            'registration_no': registration_no,
            'qrcode': qrcode,
            'status': status
        }

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_registration_no(self, registration_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'registration_no': registration_no})

    def get_by_qrcode(self, qrcode: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'qrcode': qrcode})

    def get_by_user_and_activity(self, user_id: int, activity_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'activity_id': activity_id})

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_CANCELLED:
            data['cancelled_at'] = now
        return self.exec.update_by_id(record_id, data)

    def checkin(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'checked_in': 1,
            'checkin_time': now,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_activity(self, activity_id: int, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        conditions = {'activity_id': activity_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(real_name LIKE ? OR phone LIKE ? OR registration_no LIKE ?)")
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

    def get_statistics_by_activity(self, activity_id: int) -> Dict[str, int]:
        sql = f"""
            SELECT status, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            WHERE activity_id = ? 
            GROUP BY status
        """
        results = self.db.fetch_all(sql, (activity_id,))

        stats = {
            'total': 0,
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'cancelled': 0,
            'checked_in': 0
        }

        for row in results:
            stats['total'] += row['count']
            if row['status'] == self.STATUS_PENDING:
                stats['pending'] = row['count']
            elif row['status'] == self.STATUS_APPROVED:
                stats['approved'] = row['count']
            elif row['status'] == self.STATUS_REJECTED:
                stats['rejected'] = row['count']
            elif row['status'] == self.STATUS_CANCELLED:
                stats['cancelled'] = row['count']

        checkin_sql = f"""
            SELECT COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            WHERE activity_id = ? AND checked_in = 1
        """
        checkin_result = self.db.fetch_one(checkin_sql, (activity_id,))
        if checkin_result:
            stats['checked_in'] = checkin_result['count']

        return stats

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PENDING: '待审核',
            self.STATUS_APPROVED: '已通过',
            self.STATUS_REJECTED: '已拒绝',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, registration: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': registration.get('id'),
            'registration_no': registration.get('registration_no'),
            'activity_id': registration.get('activity_id'),
            'user_id': registration.get('user_id'),
            'real_name': registration.get('real_name'),
            'phone': registration.get('phone'),
            'email': registration.get('email'),
            'remark': registration.get('remark'),
            'status': registration.get('status'),
            'status_text': self.get_status_text(registration.get('status')),
            'qrcode': registration.get('qrcode'),
            'checked_in': registration.get('checked_in'),
            'checked_in_text': '已签到' if registration.get('checked_in') == 1 else '未签到',
            'checkin_time': registration.get('checkin_time'),
            'cancelled_at': registration.get('cancelled_at'),
            'created_at': registration.get('created_at')
        }
