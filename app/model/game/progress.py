from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ProgressModel:
    TABLE_NAME = 'tb_game_progress'

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
                player_id TEXT NOT NULL,
                bio_samples INTEGER DEFAULT 0,
                completed_levels TEXT DEFAULT '[]',
                tower_upgrades TEXT DEFAULT '{{}}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(player_id)
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        existing = model.get_by_player_id('default')
        if existing:
            return
        model.upsert('default', bio_samples=200, completed_levels='[]', tower_upgrades='{}')

    def get_by_player_id(self, player_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_id': player_id})

    def upsert(self, player_id: str, bio_samples: int = 0, completed_levels: str = '[]', tower_upgrades: str = '{}') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_id': player_id,
            'bio_samples': bio_samples,
            'completed_levels': completed_levels,
            'tower_upgrades': tower_upgrades,
            'updated_at': now
        }
        return self.exec.upsert(data, ['player_id'])
