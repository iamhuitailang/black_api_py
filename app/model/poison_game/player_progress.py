from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerProgressModel:
    TABLE_NAME = 'player_progress'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME, primary_key='player_id')

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                player_id TEXT PRIMARY KEY,
                unlocked_level INTEGER DEFAULT 1 CHECK (unlocked_level >= 1 AND unlocked_level <= 12),
                total_completions INTEGER DEFAULT 0,
                last_played DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, player_id: str) -> int:
        data = {
            'player_id': player_id,
            'unlocked_level': 1,
            'total_completions': 0,
            'last_played': datetime.now().isoformat()
        }
        return self.exec.insert(data)

    def get_by_player(self, player_id: str) -> Optional[Dict[str, Any]]:
        result = self.query.find_one(conditions={'player_id': player_id})
        if not result:
            self.create(player_id)
            return self.query.find_one(conditions={'player_id': player_id})
        return result

    def update_unlocked_level(self, player_id: str, level: int) -> int:
        current = self.get_by_player(player_id)
        if current and current.get('unlocked_level', 0) < level:
            data = {
                'unlocked_level': min(level, 12),
                'last_played': datetime.now().isoformat()
            }
            return self.exec.update(data, conditions={'player_id': player_id})
        return 0

    def increment_completions(self, player_id: str) -> int:
        current = self.get_by_player(player_id)
        if current:
            data = {
                'total_completions': current.get('total_completions', 0) + 1,
                'last_played': datetime.now().isoformat()
            }
            return self.exec.update(data, conditions={'player_id': player_id})
        return 0

    def update_last_played(self, player_id: str) -> int:
        data = {
            'last_played': datetime.now().isoformat()
        }
        return self.exec.update(data, conditions={'player_id': player_id})

    def get_all(self, limit: int = 100) -> list:
        return self.query.find_all(order_by='last_played DESC', limit=limit)
