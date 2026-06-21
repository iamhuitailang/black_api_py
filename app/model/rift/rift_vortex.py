from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RiftVortexModel:
    TABLE_NAME = 'rift_vortex'

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
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                segment_id INTEGER,
                turn_created INTEGER NOT NULL,
                turns_remaining INTEGER NOT NULL DEFAULT 2,
                status TEXT NOT NULL DEFAULT 'active',
                anchors_produced INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)

    def create(self, game_id: int, x: int, y: int, segment_id: int = None, turn_created: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'x': x,
            'y': y,
            'segment_id': segment_id,
            'turn_created': turn_created,
            'turns_remaining': 2,
            'status': 'active',
            'anchors_produced': 0,
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

    def decrement_turns(self, game_id: int) -> List[int]:
        sql = f"SELECT id FROM {self.TABLE_NAME} WHERE game_id = ? AND status = 'active' AND turns_remaining <= 1"
        collapsing = self.db.fetch_all(sql, (game_id,))
        collapsing_ids = [v['id'] for v in collapsing]

        update_sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET turns_remaining = turns_remaining - 1,
                status = CASE WHEN turns_remaining - 1 <= 0 THEN 'collapsed' ELSE status END,
                anchors_produced = CASE WHEN turns_remaining - 1 <= 0 THEN 2 ELSE anchors_produced END
            WHERE game_id = ? AND status = 'active'
        """
        self.db.execute(update_sql, (game_id,))
        return collapsing_ids

    def count_active(self, game_id: int) -> int:
        return self.query.count(conditions={'game_id': game_id, 'status': 'active'})
