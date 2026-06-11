from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActionItemModel:
    TABLE_NAME = 'action_items'

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
                meeting_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                assignee TEXT DEFAULT '',
                due_date TEXT DEFAULT '',
                completed INTEGER DEFAULT 0,
                reminder_time TEXT DEFAULT '',
                reminder_email TEXT DEFAULT '',
                reminder_sent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_meeting_id ON {cls.TABLE_NAME}(meeting_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_due_date ON {cls.TABLE_NAME}(due_date)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_reminder_time ON {cls.TABLE_NAME}(reminder_time)"
        db.execute(index_sql3)

    @classmethod
    def migrate_add_reminder_fields(cls):
        db = get_db()
        try:
            columns = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
            column_names = [col['name'] for col in columns]

            if 'reminder_time' not in column_names:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN reminder_time TEXT DEFAULT ''")
                print(f"  - Added reminder_time column to {cls.TABLE_NAME}")
            if 'reminder_email' not in column_names:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN reminder_email TEXT DEFAULT ''")
                print(f"  - Added reminder_email column to {cls.TABLE_NAME}")
            if 'reminder_sent' not in column_names:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN reminder_sent INTEGER DEFAULT 0")
                print(f"  - Added reminder_sent column to {cls.TABLE_NAME}")
            return True
        except Exception as e:
            print(f"  - Migration failed: {e}")
            return False

    def create(self, meeting_id: int, content: str, assignee: str = '',
               due_date: str = '', completed: bool = False,
               reminder_time: str = '', reminder_email: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'meeting_id': meeting_id,
            'content': content,
            'assignee': assignee,
            'due_date': due_date,
            'completed': 1 if completed else 0,
            'reminder_time': reminder_time,
            'reminder_email': reminder_email,
            'reminder_sent': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row:
            row = self._parse_row(row)
        return row

    def _parse_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        row['completed'] = bool(row.get('completed', 0))
        row['reminder_sent'] = bool(row.get('reminder_sent', 0))
        if 'reminder_time' not in row:
            row['reminder_time'] = ''
        if 'reminder_email' not in row:
            row['reminder_email'] = ''
        return row

    def get_by_meeting(self, meeting_id: int) -> List[Dict[str, Any]]:
        rows = self.query.find_all({'meeting_id': meeting_id}, order_by='id ASC')
        return [self._parse_row(row) for row in rows]

    def get_all(self, completed: bool = None, overdue: bool = None,
                order_by: str = 'due_date ASC') -> List[Dict[str, Any]]:
        where_clauses = []
        params = []

        if completed is not None:
            where_clauses.append('completed = ?')
            params.append(1 if completed else 0)

        if overdue is not None:
            today = datetime.now().strftime('%Y-%m-%d')
            if overdue:
                where_clauses.append('due_date < ? AND due_date != ?')
                params.extend([today, ''])
            else:
                where_clauses.append('(due_date >= ? OR due_date = ?)')
                params.extend([today, ''])

        where_sql = ''
        if where_clauses:
            where_sql = 'WHERE ' + ' AND '.join(where_clauses)

        sql = f"SELECT * FROM {self.TABLE_NAME} {where_sql} ORDER BY {order_by}"
        rows = self.db.fetch_all(sql, tuple(params) if params else None)
        return [self._parse_row(row) for row in rows]

    def get_pending_reminders(self) -> List[Dict[str, Any]]:
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        sql = f"""
            SELECT ai.*, m.title as meeting_title
            FROM {self.TABLE_NAME} ai
            JOIN meetings m ON ai.meeting_id = m.id
            WHERE ai.completed = 0 
              AND ai.reminder_time != '' 
              AND ai.reminder_time <= ?
              AND ai.reminder_sent = 0
            ORDER BY ai.reminder_time ASC
        """
        rows = self.db.fetch_all(sql, (now,))
        return [self._parse_row(row) for row in rows]

    def mark_reminder_sent(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'reminder_sent': 1, 'updated_at': datetime.now().isoformat()})

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        allowed_fields = ['content', 'assignee', 'due_date', 'reminder_time', 'reminder_email']
        for field in allowed_fields:
            if field in kwargs:
                data[field] = kwargs[field]

        if 'completed' in kwargs:
            data['completed'] = 1 if kwargs['completed'] else 0
            if kwargs['completed']:
                data['reminder_sent'] = 1

        if 'reminder_time' in kwargs:
            data['reminder_sent'] = 0

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_meeting(self, meeting_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE meeting_id = ?"
        cursor = self.db.execute(sql, (meeting_id,))
        return cursor.rowcount if cursor else 0

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)

    def get_stats_by_project(self, project_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count
            FROM {self.TABLE_NAME} ai
            JOIN meetings m ON ai.meeting_id = m.id
            WHERE m.project_id = ?
        """
        result = self.db.fetch_one(sql, (project_id,))
        total = result['total'] if result else 0
        completed = result['completed_count'] if result and result['completed_count'] is not None else 0
        completion_rate = (completed / total * 100) if total > 0 else 0
        return {
            'total': total,
            'completed': completed,
            'completion_rate': round(completion_rate, 2)
        }

    def get_attendee_stats_by_project(self, project_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                ai.assignee,
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_count
            FROM {self.TABLE_NAME} ai
            JOIN meetings m ON ai.meeting_id = m.id
            WHERE m.project_id = ? AND ai.assignee != ''
            GROUP BY ai.assignee
            ORDER BY total DESC
        """
        rows = self.db.fetch_all(sql, (project_id,))
        return [
            {
                'assignee': row['assignee'],
                'total': row['total'],
                'completed': row['completed_count'],
                'completion_rate': round((row['completed_count'] / row['total'] * 100), 2) if row['total'] > 0 else 0
            }
            for row in rows
        ]
