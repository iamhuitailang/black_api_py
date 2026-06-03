from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScRaceResultModel:
    TABLE_NAME = 'tb_sc_model_race_results'

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
                position INTEGER NOT NULL,
                finish_time REAL NOT NULL,
                best_lap REAL,
                points_earned INTEGER DEFAULT 0,
                coins_earned INTEGER DEFAULT 0,
                race_date TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_id ON {cls.TABLE_NAME}(race_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_position ON {cls.TABLE_NAME}(race_id, position)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_date ON {cls.TABLE_NAME}(race_date)"
        db.execute(index_sql)

    def create(self, race_id: int, user_id: int, car_id: int, position: int, finish_time: float,
               team_id: int = None, best_lap: float = None, points_earned: int = 0,
               coins_earned: int = 0, race_date: str = None) -> int:
        if race_date is None:
            race_date = datetime.now().isoformat()
        data = {
            'race_id': race_id,
            'user_id': user_id,
            'car_id': car_id,
            'team_id': team_id,
            'position': position,
            'finish_time': finish_time,
            'best_lap': best_lap,
            'points_earned': points_earned,
            'coins_earned': coins_earned,
            'race_date': race_date
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_race_id(self, race_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'race_id': race_id}, order_by='position ASC')

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='race_date DESC')

    def get_top_by_race(self, race_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        offset = 0
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE race_id = ? 
            ORDER BY position ASC 
            LIMIT {limit} OFFSET {offset}
        """
        return self.db.fetch_all(sql, (race_id,))

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='race_date DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
