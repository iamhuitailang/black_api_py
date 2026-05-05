from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SignStatsModel:
    TABLE_NAME = 'tb_qd_sign_stats'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                user_id INTEGER PRIMARY KEY,
                total_days INTEGER DEFAULT 0,
                current_continuous INTEGER DEFAULT 0,
                max_continuous INTEGER DEFAULT 0,
                last_sign_date TEXT DEFAULT '',
                total_points_from_sign INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'total_days': 0,
            'current_continuous': 0,
            'max_continuous': 0,
            'last_sign_date': '',
            'total_points_from_sign': 0,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_or_create(self, user_id: int) -> Dict[str, Any]:
        stats = self.get_by_user_id(user_id)
        if not stats:
            self.create(user_id)
            stats = self.get_by_user_id(user_id)
        return stats

    def update_sign_stats(self, user_id: int, sign_date: str, points: int, 
                          continuous_days: int) -> int:
        now = datetime.now().isoformat()
        stats = self.get_or_create(user_id)
        
        total_days = stats.get('total_days', 0) + 1
        current_continuous = continuous_days
        max_continuous = max(stats.get('max_continuous', 0), continuous_days)
        total_points = stats.get('total_points_from_sign', 0) + points

        data = {
            'total_days': total_days,
            'current_continuous': current_continuous,
            'max_continuous': max_continuous,
            'last_sign_date': sign_date,
            'total_points_from_sign': total_points,
            'updated_at': now
        }
        return self.exec.update(data, {'user_id': user_id})

    def reset_continuous(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_continuous': 0,
            'updated_at': now
        }
        return self.exec.update(data, {'user_id': user_id})

    def is_consecutive_day(self, last_date: str, today: str) -> bool:
        try:
            last_dt = date.fromisoformat(last_date)
            today_dt = date.fromisoformat(today)
            return (today_dt - last_dt).days == 1
        except (ValueError, TypeError):
            return False

    def get_sign_status(self, user_id: int, today: str = None) -> Dict[str, Any]:
        if today is None:
            today = date.today().isoformat()

        stats = self.get_or_create(user_id)
        
        last_sign_date = stats.get('last_sign_date', '')
        is_signed_today = last_sign_date == today
        
        current_continuous = stats.get('current_continuous', 0)
        max_continuous = stats.get('max_continuous', 0)
        total_days = stats.get('total_days', 0)
        total_points = stats.get('total_points_from_sign', 0)

        can_sign = not is_signed_today
        
        next_award_day = None
        if current_continuous < 3:
            next_award_day = 3
        elif current_continuous < 5:
            next_award_day = 5
        elif current_continuous < 7:
            next_award_day = 7
        elif current_continuous < 15:
            next_award_day = 15
        elif current_continuous < 30:
            next_award_day = 30
        
        days_to_next_award = 0
        if next_award_day:
            days_to_next_award = next_award_day - current_continuous
            if days_to_next_award <= 0:
                days_to_next_award = 0

        return {
            'user_id': user_id,
            'today': today,
            'is_signed_today': is_signed_today,
            'current_continuous': current_continuous,
            'max_continuous': max_continuous,
            'total_days': total_days,
            'total_points': total_points,
            'can_sign': can_sign,
            'next_award_day': next_award_day,
            'days_to_next_award': days_to_next_award,
            'last_sign_date': last_sign_date
        }
