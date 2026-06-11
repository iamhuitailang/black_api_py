from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MeetingModel:
    TABLE_NAME = 'meetings'

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
                project_id INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                attendees TEXT DEFAULT '[]',
                content TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_project_id ON {cls.TABLE_NAME}(project_id)"
        db.execute(index_sql2)

    def create(self, project_id: int = 0, title: str = '', date: str = '',
               attendees: list = None, content: str = '') -> int:
        now = datetime.now().isoformat()
        if attendees is None:
            attendees = []
        data = {
            'project_id': project_id,
            'title': title,
            'date': date,
            'attendees': json.dumps(attendees, ensure_ascii=False),
            'content': content,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row:
            row = self._parse_attendees(row)
        return row

    def _parse_attendees(self, row: Dict[str, Any]) -> Dict[str, Any]:
        try:
            row['attendees'] = json.loads(row.get('attendees', '[]'))
        except (json.JSONDecodeError, TypeError):
            row['attendees'] = []
        return row

    def get_all(self, order_by: str = 'date DESC') -> List[Dict[str, Any]]:
        rows = self.query.find_all(order_by=order_by)
        return [self._parse_attendees(row) for row in rows]

    def get_by_project(self, project_id: int, order_by: str = 'date DESC') -> List[Dict[str, Any]]:
        rows = self.query.find_all({'project_id': project_id}, order_by=order_by)
        return [self._parse_attendees(row) for row in rows]

    def search(self, keyword: str = None, start_date: str = None, end_date: str = None,
               attendee: str = None, project_id: int = None,
               page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        where_clauses = []
        params = []

        if keyword:
            where_clauses.append("(title LIKE ? OR content LIKE ?)")
            params.extend([f'%{keyword}%', f'%{keyword}%'])

        if start_date:
            where_clauses.append("date >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("date <= ?")
            params.append(end_date)

        if project_id is not None:
            where_clauses.append("project_id = ?")
            params.append(project_id)

        where_sql = ''
        if where_clauses:
            where_sql = 'WHERE ' + ' AND '.join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} {where_sql}"
        total_result = self.db.fetch_one(count_sql, tuple(params) if params else None)
        raw_total = total_result['total'] if total_result else 0

        query_sql = f"SELECT * FROM {self.TABLE_NAME} {where_sql} ORDER BY date DESC"
        all_rows = self.db.fetch_all(query_sql, tuple(params) if params else None)

        all_items = [self._parse_attendees(row) for row in all_rows]

        if attendee:
            all_items = [
                item for item in all_items
                if attendee in (item.get('attendees') or [])
            ]

        filtered_total = len(all_items)

        offset = (page - 1) * page_size
        items = all_items[offset:offset + page_size]

        return {
            'items': items,
            'total': filtered_total,
            'page': page,
            'page_size': page_size,
            'total_pages': (filtered_total + page_size - 1) // page_size
        }

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        allowed_fields = ['project_id', 'title', 'date', 'content']
        for field in allowed_fields:
            if field in kwargs:
                data[field] = kwargs[field]

        if 'attendees' in kwargs:
            data['attendees'] = json.dumps(kwargs['attendees'], ensure_ascii=False)

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count_by_project(self, project_id: int) -> int:
        return self.query.count({'project_id': project_id})

    def get_distinct_attendees(self) -> List[str]:
        sql = f"SELECT DISTINCT attendees FROM {self.TABLE_NAME}"
        rows = self.db.fetch_all(sql)
        all_attendees = set()
        for row in rows:
            try:
                attendees = json.loads(row.get('attendees', '[]'))
                for a in attendees:
                    if a:
                        all_attendees.add(a.strip())
            except (json.JSONDecodeError, TypeError):
                pass
        return sorted(list(all_attendees))

    def paginate(self, page: int = 1, page_size: int = 10, conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        result = self.query.paginate(page, page_size, conditions, order_by='date DESC')
        result['items'] = [self._parse_attendees(row) for row in result['items']]
        return result
