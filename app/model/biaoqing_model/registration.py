from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RegistrationModel:
    TABLE_NAME = 'tb_biaoqing_model_registrations'

    STATUS_PENDING = 0
    STATUS_APPROVED = 1
    STATUS_REJECTED = 2
    STATUS_CANCELLED = 3

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
                name TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                extra_info TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unique ON {cls.TABLE_NAME}(activity_id, user_id)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int, name: str = '',
               phone: str = '', email: str = '', extra_info: str = '') -> int:
        existing = self.query.find_one({'activity_id': activity_id, 'user_id': user_id})
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'name': name,
            'phone': phone,
            'email': email,
            'extra_info': extra_info,
            'status': self.STATUS_PENDING,
            'created_at': now,
            'updated_at': now
        }
        result = self.exec.insert(data)
        if result > 0:
            from app.model.biaoqing_model.activity import ActivityModel
            ActivityModel().increment_participants(activity_id, 1)
        return result

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        old = self.get_by_id(record_id)
        result = self.exec.update_by_id(record_id, {'status': status, 'updated_at': now})

        if result > 0 and old:
            from app.model.biaoqing_model.activity import ActivityModel
            if old.get('status') != self.STATUS_APPROVED and status == self.STATUS_APPROVED:
                pass
            elif old.get('status') == self.STATUS_APPROVED and status != self.STATUS_APPROVED:
                ActivityModel().increment_participants(old.get('activity_id'), -1)

        return result

    def cancel(self, record_id: int) -> int:
        return self.update_status(record_id, self.STATUS_CANCELLED)

    def delete(self, record_id: int) -> int:
        reg = self.get_by_id(record_id)
        result = self.exec.delete_by_id(record_id)
        if result > 0 and reg and reg.get('status') == self.STATUS_APPROVED:
            from app.model.biaoqing_model.activity import ActivityModel
            ActivityModel().increment_participants(reg.get('activity_id'), -1)
        return result

    def get_by_activity_id(self, activity_id: int, page: int = 1, page_size: int = 20,
                           status: int = None) -> Dict[str, Any]:
        conditions = {'activity_id': activity_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def is_registered(self, activity_id: int, user_id: int) -> bool:
        return self.query.exists({'activity_id': activity_id, 'user_id': user_id})

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
            'activity_id': registration.get('activity_id'),
            'user_id': registration.get('user_id'),
            'name': registration.get('name'),
            'phone': registration.get('phone'),
            'email': registration.get('email'),
            'extra_info': registration.get('extra_info'),
            'status': registration.get('status'),
            'status_text': self.get_status_text(registration.get('status')),
            'created_at': registration.get('created_at')
        }
