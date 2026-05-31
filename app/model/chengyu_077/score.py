from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_chengyu_077_model_score'

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
                game_id INTEGER NOT NULL,
                game_type TEXT DEFAULT 'classic',
                score INTEGER DEFAULT 0,
                is_win INTEGER DEFAULT 0,
                combo INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        idx1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(idx1)
        idx2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(idx2)

    def create(self, user_id: int, game_id: int, game_type: str = 'classic', score: int = 0, is_win: int = 0, combo: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'game_id': game_id,
            'game_type': game_type,
            'score': score,
            'is_win': is_win,
            'combo': combo,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC', limit=limit)

    def get_leaderboard(self, game_type: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        if game_type:
            sql = f"""
                SELECT s.user_id, u.nickname, u.username,
                       SUM(s.score) as total_score,
                       COUNT(*) as total_games,
                       SUM(s.is_win) as total_wins
                FROM {self.TABLE_NAME} s
                LEFT JOIN {ChengyuUserModel.TABLE_NAME} u ON s.user_id = u.id
                WHERE s.game_type = ?
                GROUP BY s.user_id
                ORDER BY total_score DESC
                LIMIT ?
            """
            return self.db.fetch_all(sql, (game_type, limit))
        else:
            sql = f"""
                SELECT s.user_id, u.nickname, u.username,
                       SUM(s.score) as total_score,
                       COUNT(*) as total_games,
                       SUM(s.is_win) as total_wins
                FROM {self.TABLE_NAME} s
                LEFT JOIN {ChengyuUserModel.TABLE_NAME} u ON s.user_id = u.id
                GROUP BY s.user_id
                ORDER BY total_score DESC
                LIMIT ?
            """
            return self.db.fetch_all(sql, (limit,))


from app.model.chengyu_077.user import ChengyuUserModel
