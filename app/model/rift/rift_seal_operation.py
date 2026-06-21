from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RiftSealOperationModel:
    TABLE_NAME = 'rift_seal_operation'

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
                turn INTEGER NOT NULL,
                mode TEXT NOT NULL,
                target_segment_ids TEXT NOT NULL,
                success INTEGER NOT NULL DEFAULT 0,
                success_rate REAL NOT NULL,
                sealed_count INTEGER NOT NULL DEFAULT 0,
                expansion_count INTEGER NOT NULL DEFAULT 0,
                tracker_x_before INTEGER NOT NULL,
                tracker_y_before INTEGER NOT NULL,
                tracker_x_after INTEGER NOT NULL,
                tracker_y_after INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_turn ON {cls.TABLE_NAME}(game_id, turn)"
        db.execute(index_sql2)

    def create(self, game_id: int, turn: int, mode: str, target_segment_ids: List[int],
               success: int, success_rate: float, sealed_count: int, expansion_count: int,
               tracker_x_before: int, tracker_y_before: int,
               tracker_x_after: int, tracker_y_after: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'turn': turn,
            'mode': mode,
            'target_segment_ids': ','.join(map(str, target_segment_ids)),
            'success': success,
            'success_rate': success_rate,
            'sealed_count': sealed_count,
            'expansion_count': expansion_count,
            'tracker_x_before': tracker_x_before,
            'tracker_y_before': tracker_y_before,
            'tracker_x_after': tracker_x_after,
            'tracker_y_after': tracker_y_after,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'game_id': game_id}, order_by='turn ASC')

    def get_latest_by_game(self, game_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'game_id': game_id}, order_by='id DESC')

    def count_by_game_id(self, game_id: int) -> int:
        return self.query.count(conditions={'game_id': game_id})
