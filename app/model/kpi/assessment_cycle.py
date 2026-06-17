from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AssessmentCycleModel:
    TABLE_NAME = 'tb_kpi_assessment_cycle'

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
                name TEXT NOT NULL,
                year INTEGER NOT NULL,
                quarter INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_year_quarter ON {cls.TABLE_NAME}(year, quarter)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_year_quarter(self, year: int, quarter: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'year': year, 'quarter': quarter})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='year DESC, quarter DESC')

    def get_by_status(self, status: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': status}, order_by='year DESC, quarter DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
