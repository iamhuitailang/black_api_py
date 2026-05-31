from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZbtRecordModel:
    TABLE_NAME = 'tb_zhaobutong_model_record'

    STATUS_IN_PROGRESS = 0
    STATUS_COMPLETED = 1
    STATUS_FAILED = 2

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
                level_id INTEGER NOT NULL,
                time_used INTEGER DEFAULT 0,
                hints_used INTEGER DEFAULT 0,
                differences_found INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, level_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level_id': level_id,
            'time_used': 0,
            'hints_used': 0,
            'differences_found': 0,
            'status': self.STATUS_IN_PROGRESS,
            'started_at': now,
            'completed_at': None,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_progress(self, record_id: int, differences_found: int,
                        hints_used: int, time_used: int) -> int:
        data = {
            'differences_found': differences_found,
            'hints_used': hints_used,
            'time_used': time_used
        }
        return self.exec.update_by_id(record_id, data)

    def complete(self, record_id: int, time_used: int, hints_used: int,
                 differences_found: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_COMPLETED,
            'time_used': time_used,
            'hints_used': hints_used,
            'differences_found': differences_found,
            'completed_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def fail(self, record_id: int, time_used: int, hints_used: int,
             differences_found: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_FAILED,
            'time_used': time_used,
            'hints_used': hints_used,
            'differences_found': differences_found,
            'completed_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_user_records(self, user_id: int, status: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='id DESC')

    def get_user_level_record(self, user_id: int, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'user_id': user_id, 'level_id': level_id, 'status': self.STATUS_COMPLETED},
            order_by='time_used ASC'
        )

    def get_leaderboard(self, level_id: int = None, limit: int = 50) -> List[Dict[str, Any]]:
        if level_id:
            sql = f"""
                SELECT r.*, u.nickname, u.avatar
                FROM {self.TABLE_NAME} r
                LEFT JOIN tb_zhaobutong_model_user u ON r.user_id = u.id
                WHERE r.level_id = ? AND r.status = ?
                ORDER BY r.time_used ASC
                LIMIT ?
            """
            return self.db.fetch_all(sql, (level_id, self.STATUS_COMPLETED, limit))
        else:
            sql = f"""
                SELECT r.*, u.nickname, u.avatar, l.name as level_name
                FROM {self.TABLE_NAME} r
                LEFT JOIN tb_zhaobutong_model_user u ON r.user_id = u.id
                LEFT JOIN tb_zhaobutong_model_level l ON r.level_id = l.id
                WHERE r.status = ?
                ORDER BY r.time_used ASC
                LIMIT ?
            """
            return self.db.fetch_all(sql, (self.STATUS_COMPLETED, limit))

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                level_id: int = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if level_id:
            conditions['level_id'] = level_id
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_stats(self) -> Dict[str, Any]:
        total_games = self.query.count()
        completed = self.query.count({'status': self.STATUS_COMPLETED})
        failed = self.query.count({'status': self.STATUS_FAILED})
        sql = f"SELECT AVG(time_used) as avg_time FROM {self.TABLE_NAME} WHERE status = ?"
        avg_result = self.db.fetch_one(sql, (self.STATUS_COMPLETED,))
        avg_time = avg_result.get('avg_time', 0) if avg_result else 0
        sql2 = f"SELECT COUNT(DISTINCT user_id) as total FROM {self.TABLE_NAME}"
        unique_users = self.db.fetch_one(sql2)
        total_users = unique_users.get('total', 0) if unique_users else 0
        return {
            'total_games': total_games,
            'completed_games': completed,
            'failed_games': failed,
            'avg_time': round(avg_time, 1) if avg_time else 0,
            'total_players': total_users
        }
