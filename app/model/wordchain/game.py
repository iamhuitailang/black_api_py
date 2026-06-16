from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameModel:
    TABLE_NAME = 'tb_wordchain_game'
    
    STATUS_PLAYING = 1
    STATUS_FINISHED = 2
    STATUS_TIMEOUT = 3
    
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
                start_word TEXT NOT NULL,
                current_word TEXT,
                current_last_char TEXT,
                score INTEGER DEFAULT 0,
                round_count INTEGER DEFAULT 0,
                winning_streak INTEGER DEFAULT 0,
                max_winning_streak INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                time_limit INTEGER DEFAULT 15,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create_game(self, user_id: int, start_word: str, time_limit: int = 15) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'start_word': start_word,
            'current_word': start_word,
            'current_last_char': start_word[-1],
            'score': 0,
            'round_count': 0,
            'winning_streak': 0,
            'max_winning_streak': 0,
            'status': self.STATUS_PLAYING,
            'time_limit': time_limit,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_active_game(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'user_id': user_id, 'status': self.STATUS_PLAYING},
            order_by='id DESC'
        )

    def update_game(self, game_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(game_id, data)

    def add_score(self, game_id: int, points: int, is_streak_bonus: bool = False) -> Dict[str, Any]:
        game = self.query.find_by_id(game_id)
        if not game:
            return None
        
        new_score = game['score'] + points
        new_round = game['round_count'] + 1
        new_streak = game['winning_streak'] + 1
        new_max_streak = max(game['max_winning_streak'], new_streak)
        
        data = {
            'score': new_score,
            'round_count': new_round,
            'winning_streak': new_streak,
            'max_winning_streak': new_max_streak,
            'updated_at': datetime.now().isoformat()
        }
        
        self.exec.update_by_id(game_id, data)
        
        return {
            'new_score': new_score,
            'new_round': new_round,
            'new_streak': new_streak,
            'new_max_streak': new_max_streak,
            'is_streak_bonus': is_streak_bonus and new_streak >= 5
        }

    def reset_streak(self, game_id: int) -> int:
        data = {
            'winning_streak': 0,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(game_id, data)

    def update_current_word(self, game_id: int, word: str, last_char: str) -> int:
        data = {
            'current_word': word,
            'current_last_char': last_char,
            'updated_at': datetime.now().isoformat()
        }
        return self.exec.update_by_id(game_id, data)

    def finish_game(self, game_id: int, status: str = None) -> Dict[str, Any]:
        status_map = {
            'playing': self.STATUS_PLAYING,
            'finished': self.STATUS_FINISHED,
            'failed': self.STATUS_FINISHED,
            'timeout': self.STATUS_TIMEOUT
        }
        
        status_code = self.STATUS_FINISHED
        if status and status in status_map:
            status_code = status_map[status]
        
        data = {
            'status': status_code,
            'finished_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        self.exec.update_by_id(game_id, data)
        
        game = self.query.find_by_id(game_id)
        if game:
            status_map = {
                self.STATUS_PLAYING: 'playing',
                self.STATUS_FINISHED: 'finished',
                self.STATUS_TIMEOUT: 'timeout'
            }
            game['status'] = status_map.get(game['status'], 'playing')
        return game

    def get_by_id(self, game_id: int) -> Optional[Dict[str, Any]]:
        game = self.query.find_by_id(game_id)
        if game:
            status_map = {
                self.STATUS_PLAYING: 'playing',
                self.STATUS_FINISHED: 'finished',
                self.STATUS_TIMEOUT: 'timeout'
            }
            game['status'] = status_map.get(game['status'], 'playing')
        return game

    def get_user_games(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id},
            order_by='created_at DESC',
            limit=limit
        )

    def get_user_game_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id})

    def get_user_finished_game_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'status': self.STATUS_FINISHED})

    def get_user_best_score(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND status = ?
            ORDER BY score DESC LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id, self.STATUS_FINISHED))

    def get_user_best_streak(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT MAX(max_winning_streak) as max_streak FROM {self.TABLE_NAME} 
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        return result if result else None

    def get_user_avg_rounds(self, user_id: int) -> float:
        sql = f"""
            SELECT AVG(round_count) as avg_rounds FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND status = ?
        """
        result = self.db.fetch_one(sql, (user_id, self.STATUS_FINISHED))
        return result['avg_rounds'] if result and result['avg_rounds'] else 0.0

    def get_user_win_rate(self, user_id: int) -> float:
        total = self.get_user_game_count(user_id)
        if total == 0:
            return 0.0
        
        sql = f"""
            SELECT COUNT(*) as win_count FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND status = ? AND round_count >= 5
        """
        result = self.db.fetch_one(sql, (user_id, self.STATUS_FINISHED))
        win_count = result['win_count'] if result else 0
        
        return round(win_count / total * 100, 1)
