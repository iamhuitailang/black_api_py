from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LevelModel:
    TABLE_NAME = 'tb_game_level'

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
                name TEXT NOT NULL,
                difficulty INTEGER DEFAULT 1,
                wave_count INTEGER DEFAULT 1,
                map_config TEXT DEFAULT ''
            )
        """
        db.execute(sql)

    def create(self, name: str, difficulty: int = 1, wave_count: int = 1, map_config: str = '') -> int:
        data = {
            'name': name,
            'difficulty': difficulty,
            'wave_count': wave_count,
            'map_config': map_config
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='difficulty ASC, id ASC')

    def count(self) -> int:
        return self.query.count()
