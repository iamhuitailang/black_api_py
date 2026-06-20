from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MarketRateModel:
    TABLE_NAME = 'market_rate'

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
                city_state_id INTEGER NOT NULL,
                food_to_gold REAL DEFAULT 1.0,
                stone_to_gold REAL DEFAULT 1.0,
                wood_to_gold REAL DEFAULT 1.0,
                gold_to_food REAL DEFAULT 1.0,
                gold_to_stone REAL DEFAULT 1.0,
                gold_to_wood REAL DEFAULT 1.0,
                refresh_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_state_id ON {cls.TABLE_NAME}(city_state_id, refresh_time DESC)"
        db.execute(index_sql)

    def create(self, city_state_id: int, rates: Dict[str, float]) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_state_id': city_state_id,
            'food_to_gold': rates.get('food_to_gold', 1.0),
            'stone_to_gold': rates.get('stone_to_gold', 1.0),
            'wood_to_gold': rates.get('wood_to_gold', 1.0),
            'gold_to_food': rates.get('gold_to_food', 1.0),
            'gold_to_stone': rates.get('gold_to_stone', 1.0),
            'gold_to_wood': rates.get('gold_to_wood', 1.0),
            'refresh_time': now,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_latest(self, city_state_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'city_state_id': city_state_id},
            order_by='refresh_time DESC'
        )

    def get_all(self, city_state_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'city_state_id': city_state_id},
            order_by='refresh_time DESC',
            limit=limit
        )
