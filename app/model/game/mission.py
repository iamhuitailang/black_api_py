from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MissionModel:
    TABLE_NAME = 'tb_game_mission'

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
                save_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                mission_type TEXT NOT NULL DEFAULT 'combat',
                faction TEXT NOT NULL DEFAULT 'neutral',
                target_faction TEXT DEFAULT '',
                difficulty INTEGER NOT NULL DEFAULT 1,
                reward_credits INTEGER NOT NULL DEFAULT 100,
                reputation_military INTEGER NOT NULL DEFAULT 0,
                reputation_pirate INTEGER NOT NULL DEFAULT 0,
                bounty_pirate INTEGER NOT NULL DEFAULT 0,
                enemy_count INTEGER NOT NULL DEFAULT 1,
                enemy_difficulty INTEGER NOT NULL DEFAULT 1,
                current_enemy_index INTEGER NOT NULL DEFAULT 0,
                enemies TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'active',
                source_planet_id INTEGER,
                target_planet_id INTEGER,
                accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, template_id: int, name: str, description: str = '',
               mission_type: str = 'combat', faction: str = 'neutral', target_faction: str = '',
               difficulty: int = 1, reward_credits: int = 100,
               reputation_military: int = 0, reputation_pirate: int = 0, bounty_pirate: int = 0,
               enemy_count: int = 1, enemy_difficulty: int = 1, enemies: str = '',
               source_planet_id: int = None, target_planet_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'template_id': template_id,
            'name': name,
            'description': description,
            'mission_type': mission_type,
            'faction': faction,
            'target_faction': target_faction,
            'difficulty': difficulty,
            'reward_credits': reward_credits,
            'reputation_military': reputation_military,
            'reputation_pirate': reputation_pirate,
            'bounty_pirate': bounty_pirate,
            'enemy_count': enemy_count,
            'enemy_difficulty': enemy_difficulty,
            'current_enemy_index': 0,
            'enemies': enemies,
            'status': 'active',
            'source_planet_id': source_planet_id,
            'target_planet_id': target_planet_id,
            'accepted_at': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int, status: str = None) -> List[Dict[str, Any]]:
        conds = {'save_id': save_id}
        if status:
            conds['status'] = status
        return self.query.find_all(conds, order_by='id DESC')

    def get_active_by_save_id(self, save_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'save_id': save_id, 'status': 'active'}, order_by='id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def complete(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'status': 'completed', 'completed_at': now, 'updated_at': now})

    def fail(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'status': 'failed', 'completed_at': now, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
