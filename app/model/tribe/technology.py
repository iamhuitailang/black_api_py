from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TechnologyModel:
    TABLE_NAME = 'tb_tribe_technology'

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
                tech_id TEXT NOT NULL,
                researched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tribe_id) REFERENCES tb_tribe(id),
                UNIQUE(tribe_id, tech_id)
            )
        """
        db.execute(sql)
        idx_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_tribe_id ON {cls.TABLE_NAME}(tribe_id)"
        db.execute(idx_sql)

    def create(self, tribe_id: int, tech_id: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'tribe_id': tribe_id,
            'tech_id': tech_id,
            'researched_at': now
        }
        return self.exec.insert(data)

    def get_by_tribe(self, tribe_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'tribe_id': tribe_id}, order_by='researched_at ASC')

    def has_tech(self, tribe_id: int, tech_id: str) -> bool:
        return self.query.exists({'tribe_id': tribe_id, 'tech_id': tech_id})

    def get_researched_ids(self, tribe_id: int) -> List[str]:
        rows = self.query.find_all({'tribe_id': tribe_id}, fields=['tech_id'])
        return [row['tech_id'] for row in rows]

    def delete_by_tribe(self, tribe_id: int) -> int:
        return self.exec.delete({'tribe_id': tribe_id})
