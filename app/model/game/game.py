from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerProgressModel:
    TABLE_NAME = 'player_progress'
    
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
                current_floor INTEGER NOT NULL DEFAULT 1,
                max_floor INTEGER NOT NULL DEFAULT 1,
                unlocked_actions TEXT NOT NULL DEFAULT 'light_attack,defend',
                total_battles INTEGER NOT NULL DEFAULT 0,
                total_wins INTEGER NOT NULL DEFAULT 0,
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
            'current_floor': 1,
            'max_floor': 1,
            'unlocked_actions': 'light_attack,defend',
            'total_battles': 0,
            'total_wins': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_player(self, player_name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'player_name': player_name})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_or_create(self, player_name: str = 'player') -> Dict[str, Any]:
        record = self.get_by_player(player_name)
        if not record:
            new_id = self.create(player_name)
            record = self.get_by_id(new_id)
        return record

    def update_progress(self, record_id: int, current_floor: int, max_floor: int, 
                        unlocked_actions: str, total_battles: int, total_wins: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_floor': current_floor,
            'max_floor': max_floor,
            'unlocked_actions': unlocked_actions,
            'total_battles': total_battles,
            'total_wins': total_wins,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)


class BattleRecordModel:
    TABLE_NAME = 'battle_record'
    
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
                player_name TEXT NOT NULL,
                floor INTEGER NOT NULL,
                result TEXT NOT NULL,
                player_hp_remaining INTEGER NOT NULL DEFAULT 0,
                enemy_hp_remaining INTEGER NOT NULL DEFAULT 0,
                battle_duration INTEGER NOT NULL DEFAULT 0,
                actions_used TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql_1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql_1)
        index_sql_2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_floor ON {cls.TABLE_NAME}(floor)"
        db.execute(index_sql_2)

    def create(self, player_name: str, floor: int, result: str, 
               player_hp_remaining: int, enemy_hp_remaining: int,
               battle_duration: int, actions_used: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'floor': floor,
            'result': result,
            'player_hp_remaining': player_hp_remaining,
            'enemy_hp_remaining': enemy_hp_remaining,
            'battle_duration': battle_duration,
            'actions_used': actions_used,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_player(self, player_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'player_name': player_name},
            order_by='id DESC',
            limit=limit
        )

    def get_by_floor(self, floor: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'floor': floor},
            order_by='id DESC',
            limit=limit
        )

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)
