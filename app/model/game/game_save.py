from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameSaveModel:
    TABLE_NAME = 'game_save'
    
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
                player_id INTEGER NOT NULL,
                current_distance INTEGER DEFAULT 0,
                health INTEGER DEFAULT 100,
                ammo INTEGER DEFAULT 30,
                total_ammo INTEGER DEFAULT 90,
                current_kills INTEGER DEFAULT 0,
                play_time REAL DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES game_player(id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_active ON {cls.TABLE_NAME}(player_id, is_active)"
        db.execute(index_sql)

    def create(self, player_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_id': player_id,
            'current_distance': 0,
            'health': 100,
            'ammo': 30,
            'total_ammo': 90,
            'current_kills': 0,
            'play_time': 0,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active_save(self, player_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_id': player_id, 'is_active': 1}, order_by='id DESC')

    def update_save(self, record_id: int, distance: int = None, health: int = None, 
                    ammo: int = None, total_ammo: int = None, kills: int = None, 
                    play_time: float = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if distance is not None:
            data['current_distance'] = distance
        if health is not None:
            data['health'] = health
        if ammo is not None:
            data['ammo'] = ammo
        if total_ammo is not None:
            data['total_ammo'] = total_ammo
        if kills is not None:
            data['current_kills'] = kills
        if play_time is not None:
            data['play_time'] = play_time
        return self.exec.update_by_id(record_id, data)

    def deactivate_all(self, player_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET is_active = 0 WHERE player_id = ?"
        cursor = self.db.execute(sql, (player_id,))
        return cursor.rowcount

    def get_all_by_player(self, player_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'player_id': player_id}, order_by='id DESC')
