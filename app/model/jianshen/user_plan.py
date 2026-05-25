from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class JianshenUserPlanModel:
    TABLE_NAME = 'tb_jianshen_user_plans'

    STATUS_INACTIVE = 0
    STATUS_ACTIVE = 1

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
                plan_id INTEGER NOT NULL,
                start_date TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_plan_id ON {cls.TABLE_NAME}(plan_id)")
        db.execute(f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_plan ON {cls.TABLE_NAME}(user_id, plan_id)")

    def create(self, user_id: int, plan_id: int, start_date: str = '') -> int:
        # Deactivate existing active plans for this user
        self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET status = 0, updated_at = ? WHERE user_id = ? AND status = 1",
            (datetime.now().isoformat(), user_id)
        )
        now = datetime.now().isoformat()
        return self.exec.insert({
            'user_id': user_id,
            'plan_id': plan_id,
            'start_date': start_date,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        })

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active_by_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'status': self.STATUS_ACTIVE}, order_by='id DESC')

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['start_date', 'status']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def deactivate(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET status = 0, updated_at = ? WHERE user_id = ? AND status = 1",
            (datetime.now().isoformat(), user_id)
        )

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'plan_id': record.get('plan_id'),
            'start_date': record.get('start_date'),
            'status': record.get('status'),
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at')
        }
