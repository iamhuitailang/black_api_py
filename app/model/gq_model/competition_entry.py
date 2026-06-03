from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqCompetitionEntryModel:
    TABLE_NAME = 'tb_gq_model_competition_entry'

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
                competition_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                accuracy REAL DEFAULT 0.0,
                stars INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        indexes = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_competition_id ON {cls.TABLE_NAME}(competition_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)",
            f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_comp_user ON {cls.TABLE_NAME}(competition_id, user_id)"
        ]
        for index_sql in indexes:
            db.execute(index_sql)

    def create(self, competition_id: int, user_id: int, score: int = 0, max_combo: int = 0,
               accuracy: float = 0.0, stars: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'competition_id': competition_id,
            'user_id': user_id,
            'score': score,
            'max_combo': max_combo,
            'accuracy': accuracy,
            'stars': stars,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_competition_and_user(self, competition_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'competition_id': competition_id, 'user_id': user_id}
        )

    def get_competition_entries(self, competition_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'competition_id': competition_id},
            order_by='score DESC'
        )

    def get_user_entries(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='created_at DESC'
        )

    def update_entry(self, entry_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'score', 'max_combo', 'accuracy', 'stars'
        ]}
        return self.exec.update_by_id(entry_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_competition_rank(self, competition_id: int, user_id: int) -> int:
        sql = f"""
            SELECT COUNT(*) + 1 as rank
            FROM {self.TABLE_NAME}
            WHERE competition_id = ? AND score > (
                SELECT COALESCE(score, 0) FROM {self.TABLE_NAME}
                WHERE competition_id = ? AND user_id = ?
            )
        """
        result = self.db.fetch_one(sql, (competition_id, competition_id, user_id))
        return result['rank'] if result else 0
