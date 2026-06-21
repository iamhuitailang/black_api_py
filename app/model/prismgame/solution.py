from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SolutionModel:
    TABLE_NAME = 'prism_solution'

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
                level_id INTEGER NOT NULL,
                player_name TEXT NOT NULL DEFAULT 'Anonymous',
                rotations_used INTEGER NOT NULL DEFAULT 0,
                score INTEGER NOT NULL DEFAULT 0,
                light_path TEXT DEFAULT '',
                prism_rotations TEXT DEFAULT '',
                is_success INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, solution_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(solution_id)

    def get_by_level_id(self, level_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'level_id': level_id, 'is_success': 1},
            order_by='score DESC, rotations_used ASC',
            limit=limit
        )

    def get_best_by_level_and_player(self, level_id: int, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'level_id': level_id, 'player_name': player_name, 'is_success': 1},
            order_by='score DESC, rotations_used ASC'
        )

    def update(self, solution_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(solution_id, data)

    def delete(self, solution_id: int) -> int:
        return self.exec.delete_by_id(solution_id)

    def count(self) -> int:
        return self.query.count()
