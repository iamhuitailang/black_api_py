from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TaskModel:
    TABLE_NAME = 'tasks'

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
                deadline DATE,
                priority INTEGER DEFAULT 2,
                done INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_done_priority ON {cls.TABLE_NAME}(done, priority)"
        db.execute(index_sql)

        sample_data = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if sample_data and sample_data['total'] == 0:
            now = datetime.now().isoformat()
            today = datetime.now()
            from datetime import timedelta
            samples = [
                ('确定婚礼场地并支付定金', (today + timedelta(days=7)).strftime('%Y-%m-%d'), 1, 1),
                ('发送电子请柬并收集RSVP', (today + timedelta(days=20)).strftime('%Y-%m-%d'), 1, 0),
                ('试穿婚纱并确认尺寸', (today + timedelta(days=14)).strftime('%Y-%m-%d'), 2, 0),
                ('与司仪沟通婚礼流程', (today + timedelta(days=10)).strftime('%Y-%m-%d'), 2, 0),
                ('预订蜜月旅行机票酒店', (today + timedelta(days=45)).strftime('%Y-%m-%d'), 3, 0),
                ('确认婚宴菜单与试菜', (today + timedelta(days=5)).strftime('%Y-%m-%d'), 1, 0),
            ]
            for title, deadline, priority, done in samples:
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (title, deadline, priority, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (title, deadline, priority, done, now, now)
                )

    def create(self, title: str, deadline: str = None, priority: int = 2) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'deadline': deadline,
            'priority': priority,
            'done': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            ORDER BY done ASC, priority ASC,
                CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
                deadline ASC
        """
        results = self.db.fetch_all(sql)
        for r in results:
            if r['deadline']:
                d = datetime.strptime(r['deadline'], '%Y-%m-%d').date()
                days_left = (d - datetime.now().date()).days
                r['days_left'] = days_left
                r['is_overdue'] = days_left < 0 and not r['done']
        return results

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in kwargs.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def toggle_done(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        current = self.get_by_id(record_id)
        if not current:
            return 0
        new_done = 0 if current['done'] else 1
        return self.exec.update_by_id(record_id, {'done': new_done, 'updated_at': now})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
