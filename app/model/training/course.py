from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseModel:
    TABLE_NAME = 'courses'

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
                title TEXT NOT NULL,
                description TEXT,
                instructor TEXT,
                datetime TEXT NOT NULL,
                location TEXT,
                link TEXT,
                capacity INTEGER DEFAULT 0,
                departments TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_datetime ON {cls.TABLE_NAME}(datetime)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, title: str, description: str, instructor: str, datetime_str: str,
               location: str, link: str, capacity: int, departments: list) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description or '',
            'instructor': instructor or '',
            'datetime': datetime_str,
            'location': location or '',
            'link': link or '',
            'capacity': capacity,
            'departments': json.dumps(departments, ensure_ascii=False),
            'status': 'pending',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record and record.get('departments'):
            try:
                record['departments'] = json.loads(record['departments'])
            except:
                record['departments'] = []
        return record

    def get_all(self, status: str = None) -> List[Dict[str, Any]]:
        conditions = {}
        if status:
            conditions['status'] = status
        records = self.query.find_all(conditions=conditions, order_by='datetime DESC')
        for record in records:
            if record.get('departments'):
                try:
                    record['departments'] = json.loads(record['departments'])
                except:
                    record['departments'] = []
        return records

    def get_upcoming(self) -> List[Dict[str, Any]]:
        now = datetime.now().isoformat()
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE datetime >= ? ORDER BY datetime ASC"
        records = self.db.fetch_all(sql, (now,))
        for record in records:
            if record.get('departments'):
                try:
                    record['departments'] = json.loads(record['departments'])
                except:
                    record['departments'] = []
        return records

    def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        now = datetime.now().isoformat()
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE datetime >= ? ORDER BY datetime ASC"
        records = self.db.fetch_all(sql, (now,))
        result = []
        for record in records:
            if record.get('departments'):
                try:
                    depts = json.loads(record['departments'])
                    record['departments'] = depts
                    if department in depts:
                        result.append(record)
                except:
                    pass
        return result

    def update(self, record_id: int, title: str = None, description: str = None,
               instructor: str = None, datetime_str: str = None, location: str = None,
               link: str = None, capacity: int = None, departments: list = None,
               status: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if title is not None:
            data['title'] = title
        if description is not None:
            data['description'] = description
        if instructor is not None:
            data['instructor'] = instructor
        if datetime_str is not None:
            data['datetime'] = datetime_str
        if location is not None:
            data['location'] = location
        if link is not None:
            data['link'] = link
        if capacity is not None:
            data['capacity'] = capacity
        if departments is not None:
            data['departments'] = json.dumps(departments, ensure_ascii=False)
        if status is not None:
            data['status'] = status
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
