from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SaveModel:
    TABLE_NAME = 'tb_game_save'

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
                player_name TEXT NOT NULL DEFAULT '漂泊者',
                credits INTEGER NOT NULL DEFAULT 1000,
                current_planet_id INTEGER NOT NULL DEFAULT 1,
                ship_id INTEGER NOT NULL DEFAULT 1,
                reputation_military INTEGER NOT NULL DEFAULT 0,
                reputation_pirate INTEGER NOT NULL DEFAULT 0,
                bounty_pirate INTEGER NOT NULL DEFAULT 0,
                total_missions INTEGER NOT NULL DEFAULT 0,
                completed_missions INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, player_name: str = '漂泊者', credits: int = 1000,
               current_planet_id: int = 1, ship_id: int = 1,
               reputation_military: int = 0, reputation_pirate: int = 0,
               bounty_pirate: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'credits': credits,
            'current_planet_id': current_planet_id,
            'ship_id': ship_id,
            'reputation_military': reputation_military,
            'reputation_pirate': reputation_pirate,
            'bounty_pirate': bounty_pirate,
            'total_missions': 0,
            'completed_missions': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='updated_at DESC, id DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
