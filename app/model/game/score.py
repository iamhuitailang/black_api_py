from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'game_score'

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
                player_name TEXT NOT NULL DEFAULT '剑客',
                level_id INTEGER NOT NULL,
                completion_time REAL NOT NULL DEFAULT 0,
                damage_taken INTEGER NOT NULL DEFAULT 0,
                collectibles INTEGER NOT NULL DEFAULT 0,
                max_collectibles INTEGER NOT NULL DEFAULT 0,
                grade TEXT NOT NULL DEFAULT 'C',
                score INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        idx1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        idx2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_grade ON {cls.TABLE_NAME}(grade)"
        idx3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(idx1)
        db.execute(idx2)
        db.execute(idx3)

    def create(self, player_name: str, level_id: int, completion_time: float,
               damage_taken: int, collectibles: int, max_collectibles: int,
               grade: str, score: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'level_id': level_id,
            'completion_time': completion_time,
            'damage_taken': damage_taken,
            'collectibles': collectibles,
            'max_collectibles': max_collectibles,
            'grade': grade,
            'score': score,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_level(self, level_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'level_id': level_id},
            order_by='score DESC',
            limit=limit
        )

    def get_best_by_level(self, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'level_id': level_id},
            order_by='score DESC'
        )

    def get_ranking(self, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT player_name,
                   COUNT(DISTINCT level_id) as levels_cleared,
                   SUM(CASE WHEN grade = 'S' THEN 1 ELSE 0 END) as s_count,
                   SUM(CASE WHEN grade = 'A' THEN 1 ELSE 0 END) as a_count,
                   SUM(score) as total_score,
                   MIN(created_at) as first_play
            FROM {self.TABLE_NAME}
            GROUP BY player_name
            ORDER BY levels_cleared DESC, s_count DESC, a_count DESC, total_score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (limit,))

    def get_level_grades(self, player_name: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT level_id, grade, score, completion_time, damage_taken, collectibles, max_collectibles
            FROM {self.TABLE_NAME}
            WHERE player_name = ? AND id IN (
                SELECT id FROM {self.TABLE_NAME} t2
                WHERE t2.player_name = ? AND t2.level_id = {self.TABLE_NAME}.level_id
                ORDER BY score DESC LIMIT 1
            )
            ORDER BY level_id
        """
        return self.db.fetch_all(sql, (player_name, player_name))

    def get_all_levels_best(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT s.* FROM {self.TABLE_NAME} s
            INNER JOIN (
                SELECT level_id, MAX(score) as max_score
                FROM {self.TABLE_NAME}
                GROUP BY level_id
            ) best ON s.level_id = best.level_id AND s.score = best.max_score
            ORDER BY s.level_id
        """
        return self.db.fetch_all(sql)
