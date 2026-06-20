from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'train_game_state'

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
                distance REAL DEFAULT 0,
                fuel REAL DEFAULT 100,
                max_fuel REAL DEFAULT 100,
                speed REAL DEFAULT 10,
                is_running INTEGER DEFAULT 1,
                current_event TEXT,
                event_data TEXT,
                track_position INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create_initial_state(self) -> int:
        now = datetime.now().isoformat()
        data = {
            'distance': 0,
            'fuel': 100,
            'max_fuel': 100,
            'speed': 10,
            'is_running': 1,
            'current_event': None,
            'event_data': None,
            'track_position': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_current_state(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def update_state(self, state_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(state_id, data)

    def get_by_id(self, state_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(state_id)
