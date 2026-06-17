from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'manor_game_state'

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
                player_name TEXT NOT NULL DEFAULT 'player',
                current_room TEXT NOT NULL DEFAULT 'entrance_hall',
                lives INTEGER NOT NULL DEFAULT 3,
                flashlight_battery REAL NOT NULL DEFAULT 100.0,
                collected_items TEXT NOT NULL DEFAULT '[]',
                unlocked_rooms TEXT NOT NULL DEFAULT '["entrance_hall"]',
                activated_puzzles TEXT NOT NULL DEFAULT '[]',
                ghost_position TEXT NOT NULL DEFAULT 'basement',
                game_status TEXT NOT NULL DEFAULT 'playing',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

    def create(self, player_name: str = 'player') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'current_room': 'entrance_hall',
            'lives': 3,
            'flashlight_battery': 100.0,
            'collected_items': '[]',
            'unlocked_rooms': '["entrance_hall"]',
            'activated_puzzles': '[]',
            'ghost_position': 'basement',
            'game_status': 'playing',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_field('player_name', player_name)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)
