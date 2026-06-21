from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreboardModel:
    TABLE_NAME = 'prism_scoreboard'

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
                total_score INTEGER NOT NULL DEFAULT 0,
                levels_cleared INTEGER NOT NULL DEFAULT 0,
                total_rotations INTEGER NOT NULL DEFAULT 0,
                best_single_score INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_total_score ON {cls.TABLE_NAME}(total_score DESC)"
        db.execute(index_sql)
        index_sql2 = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_name': player_name})

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            order_by='total_score DESC, levels_cleared DESC',
            limit=limit
        )

    def update_score(self, player_name: str, score_add: int, rotations_add: int, 
                     level_cleared: bool = False) -> int:
        existing = self.get_by_player_name(player_name)
        if not existing:
            data = {
                'player_name': player_name,
                'total_score': score_add,
                'levels_cleared': 1 if level_cleared else 0,
                'total_rotations': rotations_add,
                'best_single_score': score_add
            }
            return self.create(data)
        else:
            new_total_score = existing['total_score'] + score_add
            new_levels_cleared = existing['levels_cleared'] + (1 if level_cleared else 0)
            new_total_rotations = existing['total_rotations'] + rotations_add
            new_best = max(existing['best_single_score'], score_add)
            data = {
                'total_score': new_total_score,
                'levels_cleared': new_levels_cleared,
                'total_rotations': new_total_rotations,
                'best_single_score': new_best
            }
            return self.exec.update(data, {'player_name': player_name})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size, 
            order_by='total_score DESC, levels_cleared DESC'
        )
