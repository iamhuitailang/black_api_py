from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WeddingSettingModel:
    TABLE_NAME = 'wedding_settings'

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
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        wedding_date_exists = db.fetch_one(
            f"SELECT id FROM {cls.TABLE_NAME} WHERE key = 'wedding_date'"
        )
        if not wedding_date_exists:
            from datetime import timedelta
            default_date = (datetime.now() + timedelta(days=100)).strftime('%Y-%m-%d')
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)",
                ('wedding_date', default_date, now, now)
            )

        total_budget_exists = db.fetch_one(
            f"SELECT id FROM {cls.TABLE_NAME} WHERE key = 'total_budget'"
        )
        if not total_budget_exists:
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)",
                ('total_budget', '200000', now, now)
            )

    def get(self, key: str) -> Optional[str]:
        row = self.query.find_one({'key': key})
        return row['value'] if row else None

    def get_all(self) -> Dict[str, str]:
        rows = self.query.find_all()
        return {r['key']: r['value'] for r in rows}

    def set(self, key: str, value: str) -> int:
        now = datetime.now().isoformat()
        existing = self.query.find_one({'key': key})
        if existing:
            return self.exec.update(
                {'value': value, 'updated_at': now},
                conditions={'key': key}
            )
        else:
            return self.exec.insert({
                'key': key,
                'value': value,
                'created_at': now,
                'updated_at': now
            })

    def get_countdown(self) -> Dict[str, Any]:
        date_str = self.get('wedding_date')
        if not date_str:
            return {'days_left': None, 'wedding_date': None, 'error': '未设置婚礼日期'}
        try:
            wedding_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            today = datetime.now().date()
            days_left = (wedding_date - today).days
            return {
                'days_left': days_left,
                'wedding_date': date_str,
                'is_past': days_left < 0,
                'is_today': days_left == 0
            }
        except Exception as e:
            return {'days_left': None, 'wedding_date': date_str, 'error': f'日期格式错误: {e}'}
