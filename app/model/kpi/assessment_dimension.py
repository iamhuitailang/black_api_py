from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AssessmentDimensionModel:
    TABLE_NAME = 'tb_kpi_assessment_dimension'

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
                cycle_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                weight INTEGER NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_cycle ON {cls.TABLE_NAME}(cycle_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def batch_create(self, dimensions: List[Dict[str, Any]]) -> List[int]:
        ids = []
        for dim in dimensions:
            ids.append(self.create(dim))
        return ids

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_cycle_id(self, cycle_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'cycle_id': cycle_id}, order_by='sort_order ASC, id ASC')

    def delete_by_cycle_id(self, cycle_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE cycle_id = ?"
        cursor = self.db.execute(sql, (cycle_id,))
        return cursor.rowcount if cursor else 0

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
