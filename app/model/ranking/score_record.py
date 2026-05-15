from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreRecordModel:
    TABLE_NAME = 'tb_ranking_score_record'

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
                leaderboard_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                rank INTEGER DEFAULT 0,
                ip_address TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_leaderboard_id ON {cls.TABLE_NAME}(leaderboard_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, leaderboard_id: int, score: int, ip_address: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'leaderboard_id': leaderboard_id,
            'score': score,
            'rank': 0,
            'ip_address': ip_address,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_leaderboard(self, user_id: int, leaderboard_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'user_id': user_id, 'leaderboard_id': leaderboard_id},
            order_by='score DESC'
        )

    def get_user_history(self, user_id: int, leaderboard_id: int = None, limit: int = 20) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if leaderboard_id:
            conditions['leaderboard_id'] = leaderboard_id
        return self.query.find_all(conditions, order_by='created_at DESC', limit=limit)

    def get_leaderboard_scores(self, leaderboard_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT sr.user_id, u.username, u.avatar, MAX(sr.score) as score, MAX(sr.created_at) as created_at
            FROM {self.TABLE_NAME} sr
            JOIN tb_ranking_users u ON sr.user_id = u.id
            WHERE sr.leaderboard_id = ?
            GROUP BY sr.user_id, u.username, u.avatar
            ORDER BY score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (leaderboard_id, limit))

    def get_user_best_score(self, user_id: int, leaderboard_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT MAX(score) as best_score, created_at
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND leaderboard_id = ?
        """
        return self.db.fetch_one(sql, (user_id, leaderboard_id))

    def get_user_rank(self, user_id: int, leaderboard_id: int) -> Optional[int]:
        user_best = self.get_user_best_score(user_id, leaderboard_id)
        if not user_best or user_best['best_score'] is None:
            return None

        sql = f"""
            SELECT COUNT(DISTINCT user_id) + 1 as rank
            FROM {self.TABLE_NAME}
            WHERE leaderboard_id = ? AND score > ?
        """
        result = self.db.fetch_one(sql, (leaderboard_id, user_best['best_score']))
        return result['rank'] if result else None

    def get_user_count_by_ip(self, ip_address: str, minutes: int = 5) -> int:
        time_threshold = (datetime.now() - timedelta(minutes=minutes)).isoformat()
        sql = f"""
            SELECT COUNT(DISTINCT user_id) as count
            FROM {self.TABLE_NAME}
            WHERE ip_address = ? AND created_at >= ?
        """
        result = self.db.fetch_one(sql, (ip_address, time_threshold))
        return result['count'] if result else 0

    def get_submit_count(self, user_id: int, leaderboard_id: int, minutes: int = 5) -> int:
        time_threshold = (datetime.now() - timedelta(minutes=minutes)).isoformat()
        sql = f"""
            SELECT COUNT(*) as count
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND leaderboard_id = ? AND created_at >= ?
        """
        result = self.db.fetch_one(sql, (user_id, leaderboard_id, time_threshold))
        return result['count'] if result else 0

    def clear_old_scores(self, leaderboard_id: int, period: str) -> int:
        now = datetime.now()
        if period == 'daily':
            start_time = datetime(now.year, now.month, now.day).isoformat()
        elif period == 'weekly':
            start_time = (now - timedelta(days=now.weekday())).date().isoformat()
        elif period == 'monthly':
            start_time = datetime(now.year, now.month, 1).isoformat()
        else:
            return 0

        sql = f"DELETE FROM {self.TABLE_NAME} WHERE leaderboard_id = ? AND created_at < ?"
        cursor = self.db.execute(sql, (leaderboard_id, start_time))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='created_at DESC')
