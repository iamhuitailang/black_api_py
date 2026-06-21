from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RiftAnchorModel:
    TABLE_NAME = 'rift_anchor'

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
                segment_id INTEGER NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                turn_deployed INTEGER NOT NULL,
                turns_remaining INTEGER NOT NULL DEFAULT 3,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)

    def create(self, game_id: int, segment_id: int, x: int, y: int, turn_deployed: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'segment_id': segment_id,
            'x': x,
            'y': y,
            'turn_deployed': turn_deployed,
            'turns_remaining': 3,
            'status': 'active',
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'game_id': game_id}, order_by='id ASC')

    def get_active_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'status': 'active'},
            order_by='id ASC'
        )

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def decrement_turns(self, game_id: int) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET turns_remaining = turns_remaining - 1,
                status = CASE WHEN turns_remaining - 1 <= 0 THEN 'expired' ELSE status END
            WHERE game_id = ? AND status = 'active'
        """
        cursor = self.db.execute(sql, (game_id,))
        return cursor.rowcount

    def count_active(self, game_id: int) -> int:
        return self.query.count(conditions={'game_id': game_id, 'status': 'active'})
