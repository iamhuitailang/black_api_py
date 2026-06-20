from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class InvasionEventModel:
    TABLE_NAME = 'invasion_event'

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
                invasion_year INTEGER NOT NULL,
                invasion_strength INTEGER NOT NULL,
                city_defense INTEGER NOT NULL,
                city_soldiers INTEGER NOT NULL,
                result TEXT NOT NULL,
                food_lost INTEGER DEFAULT 0,
                gold_lost INTEGER DEFAULT 0,
                soldiers_lost INTEGER DEFAULT 0,
                population_lost INTEGER DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_state_id ON {cls.TABLE_NAME}(city_state_id, invasion_year DESC)"
        db.execute(index_sql)

    def create(self, city_state_id: int, invasion_year: int, invasion_strength: int,
               city_defense: int, city_soldiers: int, result: str,
               food_lost: int = 0, gold_lost: int = 0,
               soldiers_lost: int = 0, population_lost: int = 0,
               description: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'city_state_id': city_state_id,
            'invasion_year': invasion_year,
            'invasion_strength': invasion_strength,
            'city_defense': city_defense,
            'city_soldiers': city_soldiers,
            'result': result,
            'food_lost': food_lost,
            'gold_lost': gold_lost,
            'soldiers_lost': soldiers_lost,
            'population_lost': population_lost,
            'description': description,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_city_id(self, city_state_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'city_state_id': city_state_id},
            order_by='invasion_year DESC',
            limit=limit
        )

    def get_last_invasion(self, city_state_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'city_state_id': city_state_id},
            order_by='invasion_year DESC'
        )
