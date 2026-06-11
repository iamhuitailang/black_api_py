from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckinModel:
    TABLE_NAME = 'bc_checkins'

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
                date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, date)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_date ON {cls.TABLE_NAME}(user_id, date)"
        db.execute(index_sql)

    def checkin(self, user_id: int, checkin_date: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'date': checkin_date,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user_and_date(self, user_id: int, checkin_date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one(conditions={'user_id': user_id, 'date': checkin_date})

    def get_by_user_in_month(self, user_id: int, year_month: str) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE user_id = ? AND date LIKE ? ORDER BY date ASC"
        return self.db.fetch_all(sql, (user_id, f'{year_month}%'))

    def get_all_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'user_id': user_id}, order_by='date DESC')

    def get_streak(self, user_id: int) -> int:
        checkins = self.query.find_all(conditions={'user_id': user_id}, order_by='date DESC')
        if not checkins:
            return 0

        dates = set()
        for c in checkins:
            dates.add(c['date'])

        today = date.today()
        streak = 0
        current = today

        while current.isoformat() in dates:
            streak += 1
            current -= timedelta(days=1)

        if streak == 0:
            yesterday = today - timedelta(days=1)
            current = yesterday
            while current.isoformat() in dates:
                streak += 1
                current -= timedelta(days=1)

        return streak

    def get_total_days(self, user_id: int) -> int:
        return self.query.count(conditions={'user_id': user_id})

    def delete_by_user_and_date(self, user_id: int, checkin_date: str) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ? AND date = ?"
        cursor = self.db.execute(sql, (user_id, checkin_date))
        return cursor.rowcount
