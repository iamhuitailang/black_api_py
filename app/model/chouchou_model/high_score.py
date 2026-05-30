from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class HighScoreModel:
    TABLE_NAME = 'tb_chouchou_model_high_scores'

    TYPE_SINGLE_GAME = 'single_game'
    TYPE_TOTAL_SCORE = 'total_score'
    TYPE_WIN_STREAK = 'win_streak'
    TYPE_GAMES_WON = 'games_won'

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
                score_type TEXT NOT NULL,
                score INTEGER NOT NULL,
                game_id INTEGER,
                metadata TEXT,
                achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score_type ON {cls.TABLE_NAME}(score_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type_score ON {cls.TABLE_NAME}(score_type, score)"
        db.execute(index_sql)

    def create(self, user_id: int, score_type: str, score: int,
               game_id: int = None, metadata: Dict[str, Any] = None) -> int:
        import json
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'score_type': score_type,
            'score': score,
            'game_id': game_id,
            'metadata': json.dumps(metadata) if metadata else None,
            'achieved_at': now,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, score_id: int) -> Optional[Dict[str, Any]]:
        score = self.query.find_by_id(score_id)
        if score and score.get('metadata'):
            try:
                import json
                score['metadata'] = json.loads(score['metadata'])
            except (json.JSONDecodeError, TypeError):
                score['metadata'] = None
        return score

    def get_user_best(self, user_id: int, score_type: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND score_type = ?
            ORDER BY score DESC 
            LIMIT 1
        """
        score = self.db.fetch_one(sql, (user_id, score_type))
        if score and score.get('metadata'):
            try:
                import json
                score['metadata'] = json.loads(score['metadata'])
            except (json.JSONDecodeError, TypeError):
                score['metadata'] = None
        return score

    def get_user_all_best(self, user_id: int) -> Dict[str, Any]:
        score_types = [self.TYPE_SINGLE_GAME, self.TYPE_TOTAL_SCORE, self.TYPE_WIN_STREAK, self.TYPE_GAMES_WON]
        result = {}
        for score_type in score_types:
            best = self.get_user_best(user_id, score_type)
            result[score_type] = best['score'] if best else 0
        return result

    def get_leaderboard(self, score_type: str, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                hs.*,
                u.nickname,
                u.avatar
            FROM {self.TABLE_NAME} hs
            INNER JOIN tb_chouchou_model_users u ON hs.user_id = u.id
            WHERE hs.score_type = ?
            ORDER BY hs.score DESC 
            LIMIT {limit}
        """
        scores = self.db.fetch_all(sql, (score_type,))
        for score in scores:
            if score.get('metadata'):
                try:
                    import json
                    score['metadata'] = json.loads(score['metadata'])
                except (json.JSONDecodeError, TypeError):
                    score['metadata'] = None
        return scores

    def get_all_leaderboards(self, limit: int = 10) -> Dict[str, List[Dict[str, Any]]]:
        score_types = [self.TYPE_SINGLE_GAME, self.TYPE_TOTAL_SCORE, self.TYPE_WIN_STREAK, self.TYPE_GAMES_WON]
        result = {}
        for score_type in score_types:
            result[score_type] = self.get_leaderboard(score_type, limit)
        return result

    def check_and_update_high_score(self, user_id: int, score_type: str, score: int,
                                     game_id: int = None, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        current_best = self.get_user_best(user_id, score_type)
        is_new_record = not current_best or score > current_best['score']

        if is_new_record:
            self.create(user_id, score_type, score, game_id, metadata)

        return {
            'is_new_record': is_new_record,
            'previous_best': current_best['score'] if current_best else 0,
            'current_score': score
        }

    def get_type_text(self, score_type: str) -> str:
        type_map = {
            self.TYPE_SINGLE_GAME: '单局最高分',
            self.TYPE_TOTAL_SCORE: '累计总积分',
            self.TYPE_WIN_STREAK: '连胜场次',
            self.TYPE_GAMES_WON: '获胜场次'
        }
        return type_map.get(score_type, '未知')

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, high_score: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': high_score.get('id'),
            'user_id': high_score.get('user_id'),
            'nickname': high_score.get('nickname'),
            'avatar': high_score.get('avatar'),
            'score_type': high_score.get('score_type'),
            'score_type_text': self.get_type_text(high_score.get('score_type')),
            'score': high_score.get('score'),
            'game_id': high_score.get('game_id'),
            'metadata': high_score.get('metadata'),
            'achieved_at': high_score.get('achieved_at'),
            'created_at': high_score.get('created_at')
        }
