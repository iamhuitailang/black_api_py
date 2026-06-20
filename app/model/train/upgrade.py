from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UpgradeModel:
    TABLE_NAME = 'train_upgrade'

    UPGRADE_COSTS = {
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 1000,
        6: 2000,
        7: 4000,
        8: 8000,
        9: 16000,
        10: 32000,
    }

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
                game_state_id INTEGER NOT NULL,
                carriage_id INTEGER NOT NULL,
                carriage_type TEXT NOT NULL,
                from_level INTEGER NOT NULL,
                to_level INTEGER NOT NULL,
                cost INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def record_upgrade(self, game_state_id: int, carriage_id: int, carriage_type: str,
                       from_level: int, to_level: int, cost: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_state_id': game_state_id,
            'carriage_id': carriage_id,
            'carriage_type': carriage_type,
            'from_level': from_level,
            'to_level': to_level,
            'cost': cost,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_upgrade_cost(self, current_level: int) -> int:
        return self.UPGRADE_COSTS.get(current_level + 1, 999999)

    def get_upgrade_history(self, game_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_state_id': game_state_id},
            order_by='id DESC'
        )
