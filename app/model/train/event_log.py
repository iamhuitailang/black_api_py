from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EventLogModel:
    TABLE_NAME = 'train_event_log'

    EVENT_TYPES = {
        'bandit': '劫匪车队',
        'roadblock': '路障',
        'bridge': '桥梁断裂',
        'gas_station': '加油站',
        'combat': '战斗',
        'upgrade': '升级',
        'damage': '受损',
        'system': '系统',
    }

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
                game_state_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                description TEXT,
                distance REAL DEFAULT 0,
                resolved INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_state_id ON {cls.TABLE_NAME}(game_state_id)"
        db.execute(index_sql)

    def log_event(self, game_state_id: int, event_type: str, description: str = None, 
                  distance: float = 0, resolved: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_state_id': game_state_id,
            'event_type': event_type,
            'event_name': self.EVENT_TYPES.get(event_type, event_type),
            'description': description,
            'distance': distance,
            'resolved': resolved,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_recent_events(self, game_state_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_state_id': game_state_id},
            order_by='id DESC',
            limit=limit
        )

    def get_unresolved_events(self, game_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_state_id': game_state_id, 'resolved': 0},
            order_by='id ASC'
        )

    def mark_resolved(self, event_id: int) -> int:
        return self.exec.update_by_id(event_id, {'resolved': 1})
