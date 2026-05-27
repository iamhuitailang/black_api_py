from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_cai_scores'

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
                player_id INTEGER DEFAULT 0,
                player_name TEXT DEFAULT '',
                total_games INTEGER DEFAULT 0,
                total_wins INTEGER DEFAULT 0,
                total_losses INTEGER DEFAULT 0,
                total_draws INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                highest_score INTEGER DEFAULT 0,
                correct_guesses INTEGER DEFAULT 0,
                total_guesses INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_id ON {cls.TABLE_NAME}(player_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_highest_score ON {cls.TABLE_NAME}(highest_score)"
        db.execute(index_sql)

    def create(self, player_id: int, player_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_id': player_id,
            'player_name': player_name,
            'total_games': 0,
            'total_wins': 0,
            'total_losses': 0,
            'total_draws': 0,
            'total_score': 0,
            'highest_score': 0,
            'correct_guesses': 0,
            'total_guesses': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_player_id(self, player_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_id': player_id})

    def get_or_create(self, player_id: int, player_name: str) -> Dict[str, Any]:
        score = self.get_by_player_id(player_id)
        if not score:
            self.create(player_id, player_name)
            score = self.get_by_player_id(player_id)
        return score

    def update_score(self, player_id: int, player_name: str, score: int, won: bool = None) -> int:
        score_record = self.get_or_create(player_id, player_name)
        record_id = score_record.get('id')

        now = datetime.now().isoformat()
        data = {
            'total_score': score_record.get('total_score', 0) + score,
            'highest_score': max(score_record.get('highest_score', 0), score),
            'updated_at': now
        }

        if won is True:
            data['total_wins'] = score_record.get('total_wins', 0) + 1
            data['total_games'] = score_record.get('total_games', 0) + 1
        elif won is False:
            data['total_losses'] = score_record.get('total_losses', 0) + 1
            data['total_games'] = score_record.get('total_games', 0) + 1

        return self.exec.update_by_id(record_id, data)

    def update_guess_stats(self, player_id: int, player_name: str, is_correct: bool) -> int:
        score_record = self.get_or_create(player_id, player_name)
        record_id = score_record.get('id')

        now = datetime.now().isoformat()
        data = {
            'total_guesses': score_record.get('total_guesses', 0) + 1,
            'updated_at': now
        }

        if is_correct:
            data['correct_guesses'] = score_record.get('correct_guesses', 0) + 1

        return self.exec.update_by_id(record_id, data)

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            ORDER BY highest_score DESC, total_score DESC 
            LIMIT {limit}
        """
        return self.db.fetch_all(sql)

    def get_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='highest_score DESC, total_score DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, score: Dict[str, Any]) -> Dict[str, Any]:
        win_rate = 0
        if score.get('total_games', 0) > 0:
            win_rate = round(score.get('total_wins', 0) / score.get('total_games', 1) * 100, 1)

        accuracy = 0
        if score.get('total_guesses', 0) > 0:
            accuracy = round(score.get('correct_guesses', 0) / score.get('total_guesses', 1) * 100, 1)

        return {
            'id': score.get('id'),
            'player_id': score.get('player_id'),
            'player_name': score.get('player_name'),
            'total_games': score.get('total_games'),
            'total_wins': score.get('total_wins'),
            'total_losses': score.get('total_losses'),
            'total_draws': score.get('total_draws'),
            'total_score': score.get('total_score'),
            'highest_score': score.get('highest_score'),
            'correct_guesses': score.get('correct_guesses'),
            'total_guesses': score.get('total_guesses'),
            'win_rate': win_rate,
            'accuracy': accuracy,
            'created_at': score.get('created_at')
        }
