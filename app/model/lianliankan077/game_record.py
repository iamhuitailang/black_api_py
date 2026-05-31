from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LlkGameRecordModel:
    TABLE_NAME = 'tb_lianliankan077_model_game_record'

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
                theme_id INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                combo INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                pairs_cleared INTEGER DEFAULT 0,
                hints_used INTEGER DEFAULT 0,
                props_used INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_theme_id ON {cls.TABLE_NAME}(theme_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql4)

    def create(self, user_id: int, theme_id: int, score: int = 0, duration: int = 0,
               combo: int = 0, max_combo: int = 0, pairs_cleared: int = 0,
               hints_used: int = 0, props_used: int = 0, is_completed: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'theme_id': theme_id,
            'score': score,
            'duration': duration,
            'combo': combo,
            'max_combo': max_combo,
            'pairs_cleared': pairs_cleared,
            'hints_used': hints_used,
            'props_used': props_used,
            'is_completed': is_completed,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='created_at DESC'
        )

    def get_theme_records(self, theme_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'theme_id': theme_id},
            order_by='score DESC'
        )

    def get_leaderboard(self, theme_id: int = None, page: int = 1, page_size: int = 20) -> list:
        conditions = {}
        if theme_id is not None:
            conditions['theme_id'] = theme_id

        where_clause = "WHERE 1=1"
        params = []
        if theme_id is not None:
            where_clause += " AND gr.theme_id = ?"
            params.append(theme_id)

        sql = f"""
            SELECT gr.*, u.username, u.nickname, u.avatar,
                   t.name as theme_name
            FROM {self.TABLE_NAME} gr
            LEFT JOIN tb_lianliankan077_model_user u ON gr.user_id = u.id
            LEFT JOIN tb_lianliankan077_model_theme t ON gr.theme_id = t.id
            {where_clause}
            ORDER BY gr.score DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        return self.db.fetch_all(sql, tuple(params) if params else None)

    def get_statistics(self) -> Dict[str, Any]:
        total_games_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        total_games = self.db.fetch_one(total_games_sql)

        total_score_sql = f"SELECT COALESCE(SUM(score), 0) as total FROM {self.TABLE_NAME}"
        total_score = self.db.fetch_one(total_score_sql)

        avg_score_sql = f"SELECT COALESCE(AVG(score), 0) as avg FROM {self.TABLE_NAME}"
        avg_score = self.db.fetch_one(avg_score_sql)

        completed_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE is_completed = 1"
        completed = self.db.fetch_one(completed_sql)

        today_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE DATE(created_at) = DATE('now')"
        today_games = self.db.fetch_one(today_sql)

        theme_stats_sql = f"""
            SELECT t.name as theme_name, COUNT(gr.id) as play_count,
                   COALESCE(AVG(gr.score), 0) as avg_score,
                   COALESCE(MAX(gr.score), 0) as max_score
            FROM {self.TABLE_NAME} gr
            LEFT JOIN tb_lianliankan077_model_theme t ON gr.theme_id = t.id
            GROUP BY gr.theme_id
            ORDER BY play_count DESC
        """
        theme_stats = self.db.fetch_all(theme_stats_sql)

        return {
            'total_games': total_games.get('total', 0) if total_games else 0,
            'total_score': total_score.get('total', 0) if total_score else 0,
            'avg_score': round(avg_score.get('avg', 0), 1) if avg_score else 0,
            'completed_games': completed.get('total', 0) if completed else 0,
            'today_games': today_games.get('total', 0) if today_games else 0,
            'theme_stats': theme_stats
        }

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'theme_id': record.get('theme_id'),
            'score': record.get('score'),
            'duration': record.get('duration'),
            'combo': record.get('combo'),
            'max_combo': record.get('max_combo'),
            'pairs_cleared': record.get('pairs_cleared'),
            'hints_used': record.get('hints_used'),
            'props_used': record.get('props_used'),
            'is_completed': record.get('is_completed'),
            'created_at': record.get('created_at')
        }
