from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TodoReminderModel:
    TABLE_NAME = 'tb_todo_reminders'

    REMINDER_TYPE_EMAIL = 'email'
    REMINDER_TYPE_SYSTEM = 'system'

    STATUS_PENDING = 0
    STATUS_SENT = 1
    STATUS_CANCELLED = 2

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
                user_id INTEGER NOT NULL,
                task_id INTEGER NOT NULL,
                reminder_time TIMESTAMP NOT NULL,
                reminder_type TEXT DEFAULT 'system',
                message TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    def create(self, user_id: int, task_id: int, reminder_time: str,
               reminder_type: str = 'system', message: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'task_id': task_id,
            'reminder_time': reminder_time,
            'reminder_type': reminder_type,
            'message': message,
            'status': self.STATUS_PENDING,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_task_id(self, task_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'task_id': task_id}, order_by='reminder_time ASC')

    def get_by_user_id(self, user_id: int, status: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='reminder_time ASC')

    def get_pending_reminders(self, current_time: str = None) -> List[Dict[str, Any]]:
        if not current_time:
            current_time = datetime.now().isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status = ? AND reminder_time <= ? 
            ORDER BY reminder_time ASC
        """
        return self.db.fetch_all(sql, (self.STATUS_PENDING, current_time))

    def update_status(self, record_id: int, status: int) -> int:
        return self.exec.update_by_id(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_task_id(self, task_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE task_id = ?",
            (task_id,)
        )

    def to_dict(self, reminder: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': reminder.get('id'),
            'user_id': reminder.get('user_id'),
            'task_id': reminder.get('task_id'),
            'reminder_time': reminder.get('reminder_time'),
            'reminder_type': reminder.get('reminder_type'),
            'message': reminder.get('message'),
            'status': reminder.get('status'),
            'created_at': reminder.get('created_at')
        }
