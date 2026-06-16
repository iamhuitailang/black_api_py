from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class WordModel:
    TABLE_NAME = 'tb_wordchain_word'
    
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
                word TEXT NOT NULL UNIQUE,
                first_char TEXT NOT NULL,
                last_char TEXT NOT NULL,
                length INTEGER NOT NULL,
                frequency INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_word ON {cls.TABLE_NAME}(word)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_first_char ON {cls.TABLE_NAME}(first_char)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_last_char ON {cls.TABLE_NAME}(last_char)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_length ON {cls.TABLE_NAME}(length)"
        db.execute(index_sql)

    def add_word(self, word: str) -> int:
        word = word.strip()
        if not word or len(word) < 2:
            return 0
        
        first_char = word[0]
        last_char = word[-1]
        length = len(word)
        
        data = {
            'word': word,
            'first_char': first_char,
            'last_char': last_char,
            'length': length,
            'frequency': 0,
            'created_at': datetime.now().isoformat()
        }
        
        try:
            return self.exec.upsert(data, ['word'])
        except:
            return 0

    def add_words_batch(self, words: List[str]) -> int:
        data_list = []
        now = datetime.now().isoformat()
        for word in words:
            word = word.strip()
            if word and len(word) >= 2:
                data_list.append({
                    'word': word,
                    'first_char': word[0],
                    'last_char': word[-1],
                    'length': len(word),
                    'frequency': 0,
                    'created_at': now
                })
        
        if not data_list:
            return 0
        
        return self.exec.insert_many(data_list)

    def exists(self, word: str) -> bool:
        word = word.strip()
        result = self.query.find_one({'word': word})
        return result is not None

    def validate_word(self, word: str, required_first_char: str = None) -> Dict[str, Any]:
        word = word.strip()
        
        if not word:
            return {'valid': False, 'message': '词语不能为空'}
        
        if len(word) < 2:
            return {'valid': False, 'message': '词语至少需要2个字'}
        
        word_record = self.query.find_one({'word': word})
        if not word_record:
            return {'valid': False, 'message': f'"{word}" 不是一个有效的词语'}
        
        if required_first_char and word_record['first_char'] != required_first_char:
            return {
                'valid': False,
                'message': f'词语需要以"{required_first_char}"开头',
                'required_char': required_first_char,
                'actual_char': word_record['first_char']
            }
        
        self.increment_frequency(word)
        
        return {
            'valid': True,
            'message': 'success',
            'word': word_record,
            'first_char': word_record['first_char'],
            'last_char': word_record['last_char'],
            'length': word_record['length']
        }

    def get_random_start_word(self, min_length: int = 2, max_length: int = 4) -> Optional[Dict[str, Any]]:
        sql4 = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE length = 4
            AND frequency >= ?
            ORDER BY RANDOM() LIMIT ?
        """
        min_freq = 100
        limit = 200
        results = self.db.fetch_all(sql4, (min_freq, limit))
        
        if not results:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME} 
                WHERE length >= ? AND length <= ?
                ORDER BY RANDOM() LIMIT ?
            """
            results = self.db.fetch_all(sql, (min_length, max_length, limit))
        
        if not results:
            return None
        
        import random
        return random.choice(results)

    def get_words_starting_with(self, char: str, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'first_char': char},
            order_by='frequency DESC, length ASC',
            limit=limit
        )

    def has_continuation(self, char: str, exclude_game_id: int = None) -> bool:
        if exclude_game_id:
            from app.model.wordchain import GameRoundModel
            game_round_model = GameRoundModel()
            used_words = game_round_model.get_game_words(exclude_game_id)
            if used_words:
                placeholders = ','.join(['?'] * len(used_words))
                sql = f"""
                    SELECT 1 FROM {self.TABLE_NAME} 
                    WHERE first_char = ? 
                    AND word NOT IN ({placeholders})
                    LIMIT 1
                """
                params = [char] + used_words
                result = self.db.fetch_one(sql, params)
                return result is not None
        
        result = self.query.find_one({'first_char': char})
        return result is not None

    def increment_frequency(self, word: str) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET frequency = frequency + 1 
            WHERE word = ?
        """
        cursor = self.db.execute(sql, (word,))
        return cursor.rowcount

    def count(self) -> int:
        return self.query.count()

    def get_all_words(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='word ASC')

    def delete(self, word_id: int) -> int:
        return self.exec.delete_by_id(word_id)
