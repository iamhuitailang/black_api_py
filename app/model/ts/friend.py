from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TsFriendModel:
    TABLE_NAME = 'tb_ts_friend'

    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'

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
                friend_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_friend_id ON {cls.TABLE_NAME}(friend_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, user_id: int, friend_id: int) -> int:
        if user_id == friend_id:
            return 0

        existing = self.query.find_one({
            'user_id': user_id,
            'friend_id': friend_id
        })
        if existing:
            return 0

        reverse_existing = self.query.find_one({
            'user_id': friend_id,
            'friend_id': user_id
        })
        if reverse_existing:
            if reverse_existing.get('status') == self.STATUS_ACCEPTED:
                return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'friend_id': friend_id,
            'status': self.STATUS_PENDING,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_relationship(self, user_id: int, friend_id: int) -> Optional[Dict[str, Any]]:
        relationship = self.query.find_one({
            'user_id': user_id,
            'friend_id': friend_id
        })
        if relationship:
            return relationship

        relationship = self.query.find_one({
            'user_id': friend_id,
            'friend_id': user_id
        })
        return relationship

    def get_friends(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at,
                   u.nickname, u.avatar, u.total_count, u.streak_days
            FROM {self.TABLE_NAME} f
            JOIN tb_ts_user u ON (
                (f.user_id = ? AND f.friend_id = u.id) OR
                (f.friend_id = ? AND f.user_id = u.id)
            )
            WHERE f.status = ? AND (f.user_id = ? OR f.friend_id = ?)
            ORDER BY f.created_at DESC
        """
        return self.db.fetch_all(sql, (user_id, user_id, self.STATUS_ACCEPTED, user_id, user_id))

    def get_pending_requests(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at,
                   u.nickname, u.avatar
            FROM {self.TABLE_NAME} f
            JOIN tb_ts_user u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = ?
            ORDER BY f.created_at DESC
        """
        return self.db.fetch_all(sql, (user_id, self.STATUS_PENDING))

    def get_sent_requests(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT f.id, f.user_id, f.friend_id, f.status, f.created_at,
                   u.nickname, u.avatar
            FROM {self.TABLE_NAME} f
            JOIN tb_ts_user u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = ?
            ORDER BY f.created_at DESC
        """
        return self.db.fetch_all(sql, (user_id, self.STATUS_PENDING))

    def accept_request(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_ACCEPTED})

    def reject_request(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_REJECTED})

    def remove_friend(self, user_id: int, friend_id: int) -> int:
        relationship = self.get_relationship(user_id, friend_id)
        if relationship:
            return self.exec.delete_by_id(relationship.get('id'))
        return 0

    def is_friend(self, user_id: int, friend_id: int) -> bool:
        relationship = self.get_relationship(user_id, friend_id)
        return relationship and relationship.get('status') == self.STATUS_ACCEPTED

    def get_friend_ranking(self, user_id: int, period: str = 'week', limit: int = 10) -> List[Dict[str, Any]]:
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')

        if period == 'week':
            from datetime import timedelta
            start_date = (now - timedelta(days=now.weekday())).strftime('%Y-%m-%d')
            end_date = today
        elif period == 'month':
            start_date = now.strftime('%Y-%m-01')
            end_date = today
        else:
            start_date = '2000-01-01'
            end_date = today

        sql = f"""
            SELECT 
                u.id as user_id,
                u.nickname,
                u.avatar,
                COALESCE(SUM(r.count), 0) as total_count,
                COALESCE(SUM(r.calories), 0) as total_calories
            FROM {self.TABLE_NAME} f
            JOIN tb_ts_user u ON (
                (f.user_id = ? AND f.friend_id = u.id) OR
                (f.friend_id = ? AND f.user_id = u.id)
            )
            LEFT JOIN tb_ts_record r ON u.id = r.user_id 
                AND r.record_date >= ? 
                AND r.record_date <= ? 
                AND r.status = 0
            WHERE f.status = ? AND (f.user_id = ? OR f.friend_id = ?)
            GROUP BY u.id, u.nickname, u.avatar
            ORDER BY total_count DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (
            user_id, user_id, start_date, end_date,
            self.STATUS_ACCEPTED, user_id, user_id, limit
        ))

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_PENDING: '待确认',
            self.STATUS_ACCEPTED: '已确认',
            self.STATUS_REJECTED: '已拒绝'
        }
        return status_map.get(status, '未知')
