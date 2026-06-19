from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TribespersonModel:
    TABLE_NAME = 'tb_tribesperson'

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
                tribe_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                skill_gathering REAL NOT NULL DEFAULT 0.5,
                skill_hunting REAL NOT NULL DEFAULT 0.5,
                skill_building REAL NOT NULL DEFAULT 0.5,
                skill_research REAL NOT NULL DEFAULT 0.3,
                skill_military REAL NOT NULL DEFAULT 0.3,
                skill_trade REAL NOT NULL DEFAULT 0.2,
                job TEXT NOT NULL DEFAULT 'idle',
                health INTEGER NOT NULL DEFAULT 100,
                experience INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tribe_id) REFERENCES tb_tribe(id)
            )
        """
        db.execute(sql)
        idx_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tribe_id ON {cls.TABLE_NAME}(tribe_id)"
        db.execute(idx_sql)

    def create(self, tribe_id: int, name: str,
               skill_gathering: float = 0.5, skill_hunting: float = 0.5,
               skill_building: float = 0.5, skill_research: float = 0.3,
               skill_military: float = 0.3, skill_trade: float = 0.2) -> int:
        now = datetime.now().isoformat()
        data = {
            'tribe_id': tribe_id,
            'name': name,
            'skill_gathering': skill_gathering,
            'skill_hunting': skill_hunting,
            'skill_building': skill_building,
            'skill_research': skill_research,
            'skill_military': skill_military,
            'skill_trade': skill_trade,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_tribe(self, tribe_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id}, order_by='id ASC')

    def get_by_tribe_and_job(self, tribe_id: int, job: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id, 'job': job}, order_by='id ASC')

    def assign_job(self, record_id: int, job: str) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'job': job, 'updated_at': now})

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_tribe(self, tribe_id: int) -> int:
        return self.exec.delete({'tribe_id': tribe_id})

    def count_by_tribe(self, tribe_id: int) -> int:
        return self.query.count({'tribe_id': tribe_id})

    def count_by_tribe_and_job(self, tribe_id: int, job: str) -> int:
        return self.query.count({'tribe_id': tribe_id, 'job': job})
