from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class PlayerModel:
    TABLE_NAME = 'swordsman_player'

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
                strength INTEGER DEFAULT 10,
                agility INTEGER DEFAULT 10,
                will INTEGER DEFAULT 10,
                soul_stones INTEGER DEFAULT 0,
                current_area INTEGER DEFAULT 0,
                current_wave INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 100,
                areas_cleared INTEGER DEFAULT 0,
                equipment TEXT DEFAULT '[]',
                total_kills INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_name ON {cls.TABLE_NAME}(player_name)"
        db.execute(index_sql)

        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN current_wave INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN hp INTEGER DEFAULT 100")
        except Exception:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN areas_cleared INTEGER DEFAULT 0")
        except Exception:
            pass

    def create(self, player_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'strength': 10,
            'agility': 10,
            'will': 10,
            'soul_stones': 0,
            'current_area': 0,
            'equipment': json.dumps([]),
            'total_kills': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_name(self, player_name: str) -> Optional[Dict[str, Any]]:
        record = self.query.find_one({'player_name': player_name})
        if record and record.get('equipment'):
            record['equipment'] = json.loads(record['equipment'])
        return record

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record and record.get('equipment'):
            record['equipment'] = json.loads(record['equipment'])
        return record

    def update_player(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if k not in ['id', 'created_at']}
        if 'equipment' in data and isinstance(data['equipment'], list):
            data['equipment'] = json.dumps(data['equipment'])
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        records = self.query.find_all(order_by='id DESC', limit=limit)
        for r in records:
            if r.get('equipment'):
                r['equipment'] = json.loads(r['equipment'])
        return records
