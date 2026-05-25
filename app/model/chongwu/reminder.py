from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReminderModel:
    TABLE_NAME = 'tb_chongwu_reminder'

    REPEAT_DAILY = 'daily'
    REPEAT_WEEKLY = 'weekly'
    REPEAT_MONTHLY = 'monthly'
    REPEAT_YEARLY = 'yearly'

    REPEAT_MAP = {
        REPEAT_DAILY: '每天',
        REPEAT_WEEKLY: '每周',
        REPEAT_MONTHLY: '每月',
        REPEAT_YEARLY: '每年',
    }

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
                pet_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                reminder_time TEXT NOT NULL,
                repeat_pattern TEXT DEFAULT 'daily',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_pet_id ON {cls.TABLE_NAME}(pet_id)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'pet_id': data.get('pet_id', 0),
            'title': data.get('title', ''),
            'reminder_time': data.get('reminder_time', ''),
            'repeat_pattern': data.get('repeat_pattern', 'daily'),
            'notes': data.get('notes', ''),
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_by_pet_id(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'pet_id': pet_id}
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'reminder_time', 'repeat_pattern', 'notes'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_repeat_text(self, pattern: str) -> str:
        return self.REPEAT_MAP.get(pattern, '每天')

    def to_dict(self, reminder: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': reminder.get('id'),
            'pet_id': reminder.get('pet_id'),
            'title': reminder.get('title'),
            'reminder_time': reminder.get('reminder_time'),
            'repeat_pattern': reminder.get('repeat_pattern'),
            'repeat_text': self.get_repeat_text(reminder.get('repeat_pattern', 'daily')),
            'notes': reminder.get('notes'),
            'created_at': reminder.get('created_at'),
            'updated_at': reminder.get('updated_at'),
        }