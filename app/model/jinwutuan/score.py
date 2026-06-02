from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_jinwutuan_model_score'

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_NORMAL = 'normal'
    DIFFICULTY_HARD = 'hard'

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
                song_id INTEGER NOT NULL,
                instrument_id INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                perfect_count INTEGER DEFAULT 0,
                great_count INTEGER DEFAULT 0,
                good_count INTEGER DEFAULT 0,
                miss_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song_id ON {cls.TABLE_NAME}(song_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_instrument_id ON {cls.TABLE_NAME}(instrument_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song_diff_score ON {cls.TABLE_NAME}(song_id, difficulty, score)"
        db.execute(index_sql)

    def create(self, user_id: int, song_id: int, instrument_id: int,
               difficulty: str, score: int = 0, max_combo: int = 0,
               perfect_count: int = 0, great_count: int = 0,
               good_count: int = 0, miss_count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'song_id': song_id,
            'instrument_id': instrument_id,
            'difficulty': difficulty,
            'score': score,
            'max_combo': max_combo,
            'perfect_count': perfect_count,
            'great_count': great_count,
            'good_count': good_count,
            'miss_count': miss_count,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 10,
                        song_id: int = None, difficulty: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if song_id is not None:
            conditions['song_id'] = song_id
        if difficulty:
            conditions['difficulty'] = difficulty
        return self.query.paginate(page, page_size, conditions, order_by='score DESC')

    def get_song_leaderboard(self, song_id: int, difficulty: str = None,
                              instrument_id: int = None, page: int = 1,
                              page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["song_id = ?"]
        params = [song_id]

        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

        if instrument_id is not None:
            where_clauses.append("instrument_id = ?")
            params.append(instrument_id)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY score DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_best_score(self, user_id: int, song_id: int,
                             difficulty: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ? AND song_id = ? AND difficulty = ?
            ORDER BY score DESC
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id, song_id, difficulty))

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            ORDER BY score DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql)

    def to_dict(self, score: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': score.get('id'),
            'user_id': score.get('user_id'),
            'song_id': score.get('song_id'),
            'instrument_id': score.get('instrument_id'),
            'difficulty': score.get('difficulty'),
            'score': score.get('score'),
            'max_combo': score.get('max_combo'),
            'perfect_count': score.get('perfect_count'),
            'great_count': score.get('great_count'),
            'good_count': score.get('good_count'),
            'miss_count': score.get('miss_count'),
            'created_at': score.get('created_at')
        }
