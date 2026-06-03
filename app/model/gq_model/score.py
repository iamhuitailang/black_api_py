from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqScoreModel:
    TABLE_NAME = 'tb_gq_model_score'

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
                track_id INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                accuracy REAL DEFAULT 0.0,
                stars INTEGER DEFAULT 0,
                magic_effects TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        indexes = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_track_id ON {cls.TABLE_NAME}(track_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_track ON {cls.TABLE_NAME}(user_id, track_id)"
        ]
        for index_sql in indexes:
            db.execute(index_sql)

    def create(self, user_id: int, track_id: int, score: int = 0, max_combo: int = 0,
               accuracy: float = 0.0, stars: int = 0, magic_effects: str = '[]') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'track_id': track_id,
            'score': score,
            'max_combo': max_combo,
            'accuracy': accuracy,
            'stars': stars,
            'magic_effects': magic_effects,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_track(self, user_id: int, track_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'user_id': user_id, 'track_id': track_id},
            order_by='score DESC'
        )

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='created_at DESC'
        )

    def get_track_scores(self, track_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'track_id': track_id},
            order_by='score DESC'
        )

    def get_user_best_score(self, user_id: int, track_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'user_id': user_id, 'track_id': track_id},
            order_by='score DESC'
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.delete(conditions={'user_id': user_id})
