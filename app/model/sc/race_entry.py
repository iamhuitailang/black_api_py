from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScRaceEntryModel:
    TABLE_NAME = 'tb_sc_model_race_entries'

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
                race_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                car_id INTEGER NOT NULL,
                team_id INTEGER,
                entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_qualified INTEGER DEFAULT 0,
                qualifying_time REAL
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_id ON {cls.TABLE_NAME}(race_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_user ON {cls.TABLE_NAME}(race_id, user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_qualified ON {cls.TABLE_NAME}(is_qualified)"
        db.execute(index_sql)

    def create(self, race_id: int, user_id: int, car_id: int, team_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'race_id': race_id,
            'user_id': user_id,
            'car_id': car_id,
            'team_id': team_id,
            'entry_time': now,
            'is_qualified': 0,
            'qualifying_time': None
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_race_id(self, race_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'race_id': race_id}, order_by='entry_time ASC')

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='entry_time DESC')

    def get_by_race_and_user(self, race_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'race_id': race_id, 'user_id': user_id})

    def update_qualifying(self, record_id: int, is_qualified: bool, qualifying_time: float = None) -> int:
        data = {
            'is_qualified': 1 if is_qualified else 0,
            'qualifying_time': qualifying_time
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
