from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RegistrationModel:
    TABLE_NAME = 'tb_yeyou_registrations'

    STATUS_REGISTERED = 'registered'
    STATUS_CHECKED_IN = 'checked_in'
    STATUS_CANCELLED = 'cancelled'

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
                activity_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                status TEXT DEFAULT 'registered',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checked_in_at TIMESTAMP,
                cancelled_at TIMESTAMP,
                UNIQUE(activity_id, user_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'status': self.STATUS_REGISTERED,
            'joined_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_activity_and_user(self, activity_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'activity_id': activity_id, 'user_id': user_id})

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='joined_at DESC')

    def get_by_activity(self, activity_id: int, page: int = 1, page_size: int = 10,
                        status: str = None) -> Dict[str, Any]:
        conditions = {'activity_id': activity_id}
        if status:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='joined_at ASC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {'status': status}
        if status == self.STATUS_CHECKED_IN:
            data['checked_in_at'] = now
        elif status == self.STATUS_CANCELLED:
            data['cancelled_at'] = now
        return self.exec.update_by_id(record_id, data)

    def check_in(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CHECKED_IN)

    def cancel(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CANCELLED)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_REGISTERED: '已报名',
            self.STATUS_CHECKED_IN: '已签到',
            self.STATUS_CANCELLED: '已取消',
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, registration: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': registration.get('id'),
            'activity_id': registration.get('activity_id'),
            'user_id': registration.get('user_id'),
            'status': registration.get('status'),
            'status_text': self.get_status_text(registration.get('status')),
            'joined_at': registration.get('joined_at'),
            'checked_in_at': registration.get('checked_in_at'),
            'cancelled_at': registration.get('cancelled_at')
        }
