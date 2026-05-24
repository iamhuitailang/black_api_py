from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DailyHotModel:
    TABLE_NAME = 'tb_mxt_daily_hot'
    
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
                date TEXT NOT NULL,
                job_ids TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_sql)

    def create(self, date: str, job_ids: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'date': date,
            'job_ids': job_ids,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_date(self, date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'date': date})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='date DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
