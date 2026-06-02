from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_danzhu_model_scores'

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
                level_id INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                combo_max INTEGER DEFAULT 0,
                combo_count INTEGER DEFAULT 0,
                balls_used INTEGER DEFAULT 0,
                play_duration INTEGER DEFAULT 0,
                hit_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at DESC)"
        db.execute(index_sql4)

    def create(self, user_id: int, level_id: int = 0, score: int = 0,
                 combo_max: int = 0, combo_count: int = 0,
                 balls_used: int = 0, play_duration: int = 0,
                 hit_count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level_id': level_id,
            'score': score,
            'combo_max': combo_max,
            'combo_count': combo_count,
            'balls_used': balls_used,
            'play_duration': play_duration,
            'hit_count': hit_count,
            'created_at': now
        }
        score_id = self.exec.insert(data)

        from app.model.danzhu_model.user import UserModel
        user_model = UserModel()
        user_model.update_game_stats(user_id, score, combo_max)

        return score_id

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_high_score(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id}, order_by='score DESC')

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size, {'user_id': user_id}, order_by='created_at DESC')

    def get_top_scores(self, level_id: int = None, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if level_id and level_id > 0:
            where_clauses.append("level_id = ?")
            params.append(level_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params) if params else None)
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT s.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} s
            LEFT JOIN tb_danzhu_model_users u ON s.user_id = u.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY s.score DESC, s.created_at ASC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params) if params else None)

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_rank(self, user_id: int, level_id: int = None) -> int:
        user_score = self.get_user_high_score(user_id)
        if not user_score:
            return -1

        where_clauses = ["1=1"]
        params = [user_score.get('score', 0)]

        if level_id and level_id > 0:
            where_clauses.append("level_id = ?")
            params.append(level_id)

        where_clauses.append("score > ?")

        sql = f"""
            SELECT COUNT(*) + 1 as rank
            FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params))
        return result['rank'] if result else -1

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, level_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if level_id:
            conditions['level_id'] = level_id

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_statistics(self, level_id: int = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if level_id and level_id > 0:
            where_clauses.append("level_id = ?")
            params.append(level_id)

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        sql = f"""
            SELECT 
                COUNT(*) as total_games,
                SUM(score) as total_score,
                AVG(score) as avg_score,
                MAX(score) as max_score,
                SUM(combo_max) as total_combo,
                AVG(combo_max) as avg_combo,
                SUM(hit_count) as total_hits,
                SUM(play_duration) as total_duration,
                COUNT(DISTINCT user_id) as total_players
            FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params) if params else None)

        return result or {
            'total_games': 0,
            'total_score': 0,
            'avg_score': 0,
            'max_score': 0,
            'total_combo': 0,
            'avg_combo': 0,
            'total_hits': 0,
            'total_duration': 0,
            'total_players': 0
        }

    def to_dict(self, score: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': score.get('id'),
            'user_id': score.get('user_id'),
            'level_id': score.get('level_id'),
            'score': score.get('score'),
            'combo_max': score.get('combo_max'),
            'combo_count': score.get('combo_count'),
            'balls_used': score.get('balls_used'),
            'play_duration': score.get('play_duration'),
            'hit_count': score.get('hit_count'),
            'nickname': score.get('nickname'),
            'avatar': score.get('avatar'),
            'created_at': score.get('created_at')
        }
