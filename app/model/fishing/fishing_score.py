from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FishingScoreModel:
    TABLE_NAME = 'fishing_scores'

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
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                fish_count INTEGER NOT NULL DEFAULT 0,
                biggest_fish REAL NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql_score = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql_score)
        index_sql_created = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql_created)

    def create(self, player_name: str, score: int, fish_count: int, biggest_fish: float) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name.strip() if player_name else 'Anonymous',
            'score': max(0, int(score)),
            'fish_count': max(0, int(fish_count)),
            'biggest_fish': max(0.0, float(biggest_fish)),
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC, created_at ASC', limit=limit)

    def count(self) -> int:
        return self.query.count()

    def get_player_best(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            where={'player_name': player_name},
            order_by='score DESC'
        )

    def paginate_leaderboard(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='score DESC, created_at ASC')
