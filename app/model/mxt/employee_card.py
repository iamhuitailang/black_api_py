from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EmployeeCardModel:
    TABLE_NAME = 'tb_mxt_employee_card'
    
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
                application_id INTEGER NOT NULL UNIQUE,
                employee_no TEXT NOT NULL,
                applicant_name TEXT NOT NULL,
                job_id INTEGER NOT NULL,
                job_name TEXT NOT NULL,
                valid_period TEXT DEFAULT '永远',
                is_shared INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_employee_no ON {cls.TABLE_NAME}(employee_no)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_application_id ON {cls.TABLE_NAME}(application_id)"
        db.execute(index_sql2)

    def create(self, application_id: int, employee_no: str, applicant_name: str,
               job_id: int, job_name: str, valid_period: str = '永远') -> int:
        now = datetime.now().isoformat()
        data = {
            'application_id': application_id,
            'employee_no': employee_no,
            'applicant_name': applicant_name,
            'job_id': job_id,
            'job_name': job_name,
            'valid_period': valid_period,
            'is_shared': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_application_id(self, application_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'application_id': application_id})

    def get_by_employee_no(self, employee_no: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'employee_no': employee_no})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='created_at DESC')

    def update_shared(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record_id, {'is_shared': 1, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
