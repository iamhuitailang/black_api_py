from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DemandModel:
    TABLE_NAME = 'tb_tutor_demand'

    STATUS_ACTIVE = 'active'
    STATUS_MATCHED = 'matched'
    STATUS_CLOSED = 'closed'

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
                parent_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                grade TEXT NOT NULL,
                frequency TEXT,
                budget_min INTEGER DEFAULT 0,
                budget_max INTEGER DEFAULT 0,
                preferred_times TEXT,
                description TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_subject ON {cls.TABLE_NAME}(subject)"
        db.execute(index_sql3)

    def create(self, parent_id: int, subject: str, grade: str, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'parent_id': parent_id,
            'subject': subject,
            'grade': grade,
            'frequency': kwargs.get('frequency', ''),
            'budget_min': kwargs.get('budget_min', 0),
            'budget_max': kwargs.get('budget_max', 0),
            'preferred_times': kwargs.get('preferred_times', ''),
            'description': kwargs.get('description', ''),
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and row.get('preferred_times'):
            row['preferred_times_list'] = [t for t in row['preferred_times'].split(',') if t]
        elif row:
            row['preferred_times_list'] = []
        return row

    def get_by_parent_id(self, parent_id: int) -> List[Dict[str, Any]]:
        rows = self.query.find_all({'parent_id': parent_id}, order_by='id DESC')
        for row in rows:
            if row.get('preferred_times'):
                row['preferred_times_list'] = [t for t in row['preferred_times'].split(',') if t]
            else:
                row['preferred_times_list'] = []
        return rows

    def list_active(self) -> List[Dict[str, Any]]:
        rows = self.query.find_all({'status': self.STATUS_ACTIVE}, order_by='id DESC')
        for row in rows:
            if row.get('preferred_times'):
                row['preferred_times_list'] = [t for t in row['preferred_times'].split(',') if t]
            else:
                row['preferred_times_list'] = []
        return rows

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'updated_at': now
        }
        for key in ['subject', 'grade', 'frequency', 'budget_min', 'budget_max',
                    'preferred_times', 'description', 'status']:
            if key in kwargs:
                data[key] = kwargs[key]
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
