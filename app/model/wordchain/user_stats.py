from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserStatsModel:
    TABLE_NAME = 'tb_wordchain_user_stats'
    
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
                user_id INTEGER NOT NULL UNIQUE,
                total_games INTEGER DEFAULT 0,
                total_words INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                max_winning_streak INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                best_rounds INTEGER DEFAULT 0,
                win_rate REAL DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def init_user_stats(self, user_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id})
        if existing:
            return existing['id']
        
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'total_games': 0,
            'total_words': 0,
            'total_score': 0,
            'wins': 0,
            'max_winning_streak': 0,
            'best_score': 0,
            'best_rounds': 0,
            'win_rate': 0,
            'avg_response_time': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_user_stats(self, user_id: int) -> Optional[Dict[str, Any]]:
        self.init_user_stats(user_id)
        return self.query.find_one({'user_id': user_id})

    def update_user_stats(self, user_id: int, stats_data: Dict[str, Any]) -> int:
        self.init_user_stats(user_id)
        stats_data['updated_at'] = datetime.now().isoformat()
        return self.exec.update(stats_data, {'user_id': user_id})

    def increment_total_games(self, user_id: int) -> int:
        self.init_user_stats(user_id)
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET total_games = total_games + 1, updated_at = ?
            WHERE user_id = ?
        """
        cursor = self.db.execute(sql, (datetime.now().isoformat(), user_id))
        return cursor.rowcount

    def update_after_game(self, user_id: int, score: int, rounds: int, 
                          max_streak: int, is_win: bool, words_count: int) -> int:
        self.init_user_stats(user_id)
        current = self.get_user_stats(user_id)
        
        new_total_score = current['total_score'] + score
        new_total_words = current['total_words'] + words_count
        new_wins = current['wins'] + (1 if is_win else 0)
        new_max_streak = max(current['max_winning_streak'], max_streak)
        new_best_score = max(current['best_score'], score)
        new_best_rounds = max(current['best_rounds'], rounds)
        
        new_total_games = current['total_games'] + 1
        new_win_rate = round(new_wins / new_total_games * 100, 1) if new_total_games > 0 else 0
        
        data = {
            'total_games': new_total_games,
            'total_words': new_total_words,
            'total_score': new_total_score,
            'wins': new_wins,
            'max_winning_streak': new_max_streak,
            'best_score': new_best_score,
            'best_rounds': new_best_rounds,
            'win_rate': new_win_rate,
            'updated_at': datetime.now().isoformat()
        }
        
        return self.exec.update(data, {'user_id': user_id})

    def get_leaderboard(self, limit: int = 10) -> list:
        sql = f"""
            SELECT s.*, u.username 
            FROM {self.TABLE_NAME} s
            JOIN tb_auth_user u ON s.user_id = u.id
            WHERE u.status = 1
            ORDER BY s.best_score DESC, s.max_winning_streak DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))
