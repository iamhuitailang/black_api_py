from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRoundModel:
    TABLE_NAME = 'tb_wordchain_game_round'
    
    SOURCE_USER = 'player'
    SOURCE_SYSTEM = 'system'
    
    RESULT_SUCCESS = 'success'
    RESULT_FAILED = 'failed'
    RESULT_TIMEOUT = 'timeout'
    
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
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                source TEXT NOT NULL,
                word TEXT NOT NULL,
                first_char TEXT,
                last_char TEXT,
                word_length INTEGER,
                score INTEGER DEFAULT 0,
                streak_count INTEGER DEFAULT 0,
                is_streak_bonus INTEGER DEFAULT 0,
                result TEXT,
                message TEXT,
                response_time INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_word ON {cls.TABLE_NAME}(word)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_first_char ON {cls.TABLE_NAME}(first_char)"
        db.execute(index_sql)

    def add_round(self, game_id: int, user_id: int, round_number: int, 
                  source: str, word: str, first_char: str, last_char: str,
                  score: int = 0, result: str = None, word_length: int = None, 
                  streak_count: int = 0, is_streak_bonus: bool = False,
                  message: str = None, response_time: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'round_number': round_number,
            'source': source,
            'word': word,
            'first_char': first_char,
            'last_char': last_char,
            'word_length': word_length or len(word) if word else 0,
            'score': score,
            'streak_count': streak_count,
            'is_streak_bonus': 1 if is_streak_bonus else 0,
            'result': result,
            'message': message,
            'response_time': response_time,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_game_words(self, game_id: int) -> List[str]:
        sql = f"""
            SELECT word FROM {self.TABLE_NAME} 
            WHERE game_id = ? AND result = ?
        """
        results = self.db.fetch_all(sql, (game_id, self.RESULT_SUCCESS))
        return [row['word'] for row in results] if results else []

    def get_game_rounds(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id},
            order_by='round_number ASC'
        )

    def get_user_rounds(self, user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'source': self.SOURCE_USER, 'result': self.RESULT_SUCCESS},
            order_by='created_at DESC',
            limit=limit
        )

    def get_user_first_char_stats(self, user_id: int, limit: int = 15) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT first_char, COUNT(*) as count 
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND source = ? AND result = ? AND first_char IS NOT NULL
            GROUP BY first_char 
            ORDER BY count DESC 
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, self.SOURCE_USER, self.RESULT_SUCCESS, limit))

    def get_user_word_count(self, user_id: int) -> int:
        return self.query.count({
            'user_id': user_id,
            'source': self.SOURCE_USER,
            'result': self.RESULT_SUCCESS
        })

    def get_user_avg_response_time(self, user_id: int) -> float:
        sql = f"""
            SELECT AVG(response_time) as avg_time FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND source = ? AND result = ? AND response_time IS NOT NULL
        """
        result = self.db.fetch_one(sql, (user_id, self.SOURCE_USER, self.RESULT_SUCCESS))
        return result['avg_time'] if result and result['avg_time'] else 0.0
