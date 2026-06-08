from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_danzhu_model_score'

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
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                highest_combo INTEGER DEFAULT 0,
                level_id INTEGER DEFAULT 1,
                level_name TEXT DEFAULT '默认关卡',
                balls_used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql3)

    def create(self, user_id: int, username: str, score: int,
               highest_combo: int = 0, level_id: int = 1,
               level_name: str = '默认关卡', balls_used: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'username': username,
            'score': score,
            'highest_combo': highest_combo,
            'level_id': level_id,
            'level_name': level_name,
            'balls_used': balls_used,
            'created_at': now,
        }
        return self.exec.insert(data)

    def get_top_scores(self, limit: int = 50, period: str = 'all') -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.* FROM {self.TABLE_NAME} s
            INNER JOIN (
                SELECT user_id, MAX(score) as max_score
                FROM {self.TABLE_NAME}
        """
        params = []

        if period == 'daily':
            start_time = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()
            sql += " WHERE created_at >= ?"
            params.append(start_time)
        elif period == 'weekly':
            start_time = (datetime.now() - timedelta(days=7)).isoformat()
            sql += " WHERE created_at >= ?"
            params.append(start_time)

        sql += """
                GROUP BY user_id
            ) max_scores ON s.user_id = max_scores.user_id AND s.score = max_scores.max_score
            GROUP BY s.user_id
            ORDER BY s.score DESC, s.id ASC
            LIMIT ?
        """
        params.append(limit)

        return self.db.fetch_all(sql, tuple(params))

    def get_user_best(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'user_id': user_id},
            order_by='score DESC'
        )

    def get_user_scores(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'user_id': user_id},
            order_by='score DESC, id DESC',
            limit=limit
        )

    def count(self) -> int:
        return self.query.count()

    def get_user_rank(self, user_id: int, period: str = 'all') -> Optional[int]:
        best = self.get_user_best(user_id)
        if not best:
            return None

        sql = f"SELECT COUNT(DISTINCT user_id) + 1 as rank FROM {self.TABLE_NAME} WHERE score > ?"
        params = [best.get('score', 0)]

        if period == 'daily':
            start_time = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()
            sql += " AND created_at >= ?"
            params.append(start_time)
        elif period == 'weekly':
            start_time = (datetime.now() - timedelta(days=7)).isoformat()
            sql += " AND created_at >= ?"
            params.append(start_time)

        result = self.db.fetch_one(sql, tuple(params))
        return result.get('rank') if result else None
