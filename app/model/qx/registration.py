from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RegistrationModel:
    TABLE_NAME = 'tb_qx_registrations'

    STATUS_REGISTERED = '已报名'
    STATUS_CHECKED_IN = '已签到'
    STATUS_CANCELLED = '已取消'

    STATUSES = [STATUS_REGISTERED, STATUS_CHECKED_IN, STATUS_CANCELLED]

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
                status TEXT DEFAULT '已报名',
                emergency_contact TEXT DEFAULT '',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, activity_id: int, user_id: int, emergency_contact: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'activity_id': activity_id,
            'user_id': user_id,
            'status': self.STATUS_REGISTERED,
            'emergency_contact': emergency_contact,
            'joined_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_activity_and_user(self, activity_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'activity_id': activity_id, 'user_id': user_id})

    def update_status(self, registration_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(registration_id, data)

    def check_in(self, registration_id: int) -> int:
        return self.update_status(registration_id, self.STATUS_CHECKED_IN)

    def cancel(self, registration_id: int) -> int:
        return self.update_status(registration_id, self.STATUS_CANCELLED)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

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
        return self.query.paginate(page, page_size, conditions, order_by='joined_at DESC')

    def get_users_by_activity(self, activity_id: int, status: str = None) -> List[Dict[str, Any]]:
        where_clauses = ["activity_id = ?"]
        params = [activity_id]

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        sql = f"""
            SELECT r.*, u.nickname, u.avatar, u.level, u.bike_type
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_qx_users u ON r.user_id = u.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY r.joined_at DESC
        """
        return self.db.fetch_all(sql, tuple(params))

    def get_activities_by_user(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        where_clauses = ["r.user_id = ?"]
        params = [user_id]

        if status:
            where_clauses.append("r.status = ?")
            params.append(status)

        sql = f"""
            SELECT r.*, a.title, a.route, a.distance, a.elevation, 
                   a.meeting_time, a.meeting_point, a.status as activity_status
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_qx_activities a ON r.activity_id = a.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY r.joined_at DESC
        """
        return self.db.fetch_all(sql, tuple(params))

    def get_status_text(self, status: str) -> str:
        return status or '未知'

    def to_dict(self, registration: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': registration.get('id'),
            'activity_id': registration.get('activity_id'),
            'user_id': registration.get('user_id'),
            'status': registration.get('status'),
            'status_text': self.get_status_text(registration.get('status')),
            'emergency_contact': registration.get('emergency_contact'),
            'joined_at': registration.get('joined_at'),
            'updated_at': registration.get('updated_at')
        }
