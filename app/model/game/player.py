from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerModel:
    TABLE_NAME = 'game_player'
    
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
                player_name TEXT NOT NULL UNIQUE,
                total_kills INTEGER DEFAULT 0,
                total_play_time REAL DEFAULT 0,
                best_clear_time REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

    def create(self, player_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'total_kills': 0,
            'total_play_time': 0,
            'best_clear_time': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_name': player_name})

    def get_or_create(self, player_name: str) -> Dict[str, Any]:
        player = self.get_by_name(player_name)
        if not player:
            new_id = self.create(player_name)
            player = self.get_by_id(new_id)
        return player

    def update_stats(self, record_id: int, kills: int = None, play_time: float = None, clear_time: float = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if kills is not None:
            data['total_kills'] = kills
        if play_time is not None:
            data['total_play_time'] = play_time
        if clear_time is not None:
            data['best_clear_time'] = clear_time
        return self.exec.update_by_id(record_id, data)

    def update_best_clear_time(self, record_id: int, clear_time: float) -> int:
        player = self.get_by_id(record_id)
        if player and (player.get('best_clear_time') is None or clear_time < player['best_clear_time']):
            return self.update_stats(record_id, clear_time=clear_time)
        return 0
