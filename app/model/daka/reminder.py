from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReminderModel:
    TABLE_NAME = 'tb_daka_reminders'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

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
                task_id INTEGER DEFAULT 0,
                title TEXT DEFAULT '',
                content TEXT DEFAULT '',
                remind_time TEXT NOT NULL,
                repeat_type TEXT DEFAULT 'daily',
                is_enabled INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_enabled ON {cls.TABLE_NAME}(is_enabled)"
        db.execute(index_sql)

    def create(self, user_id: int, task_id: int = 0, title: str = '', content: str = '',
               remind_time: str = '', repeat_type: str = 'daily') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'task_id': task_id,
            'title': title,
            'content': content,
            'remind_time': remind_time,
            'repeat_type': repeat_type,
            'is_enabled': self.STATUS_ENABLED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_reminders(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='remind_time ASC')

    def get_user_enabled_reminders(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'is_enabled': self.STATUS_ENABLED},
            order_by='remind_time ASC'
        )

    def get_task_reminders(self, user_id: int, task_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'task_id': task_id},
            order_by='remind_time ASC'
        )

    def update(self, reminder_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'content', 'remind_time', 'repeat_type', 'is_enabled'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(reminder_id, update_data)

    def toggle_status(self, reminder_id: int) -> int:
        reminder = self.get_by_id(reminder_id)
        if not reminder:
            return 0
        new_status = self.STATUS_DISABLED if reminder.get('is_enabled') == self.STATUS_ENABLED else self.STATUS_ENABLED
        return self.update(reminder_id, {'is_enabled': new_status})

    def delete(self, reminder_id: int) -> int:
        return self.exec.delete_by_id(reminder_id)

    def delete_by_task(self, user_id: int, task_id: int) -> int:
        return self.exec.delete({'user_id': user_id, 'task_id': task_id})

    def get_reminders_by_time(self, remind_time: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'remind_time': remind_time, 'is_enabled': self.STATUS_ENABLED}
        )

    def to_dict(self, reminder: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': reminder.get('id'),
            'user_id': reminder.get('user_id'),
            'task_id': reminder.get('task_id'),
            'title': reminder.get('title'),
            'content': reminder.get('content'),
            'remind_time': reminder.get('remind_time'),
            'repeat_type': reminder.get('repeat_type'),
            'is_enabled': reminder.get('is_enabled'),
            'created_at': reminder.get('created_at'),
            'updated_at': reminder.get('updated_at')
        }
