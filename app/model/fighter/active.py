import json
from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db


class ActiveBattleModel:
    TABLE_NAME = 'fighter_active_battle'

    def __init__(self):
        self.db = get_db()

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                state_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def save(self, state: Dict[str, Any]) -> None:
        now = datetime.now().isoformat()
        state_json = json.dumps(state, ensure_ascii=False)
        
        existing = self.get()
        if existing:
            sql = f"UPDATE {self.TABLE_NAME} SET state_json = ?, updated_at = ? WHERE id = 1"
            self.db.execute(sql, (state_json, now))
        else:
            sql = f"INSERT INTO {self.TABLE_NAME} (id, state_json, updated_at) VALUES (1, ?, ?)"
            self.db.execute(sql, (state_json, now))

    def get(self) -> Optional[Dict[str, Any]]:
        sql = f"SELECT state_json FROM {self.TABLE_NAME} WHERE id = 1"
        row = self.db.fetch_one(sql)
        if row:
            return json.loads(row['state_json'])
        return None

    def clear(self) -> None:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE id = 1"
        self.db.execute(sql)
