from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RecordModel:
    TABLE_NAME = 'tb_daka_records'

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
                task_name TEXT DEFAULT '',
                task_icon TEXT DEFAULT '',
                target_value INTEGER DEFAULT 1,
                current_value INTEGER DEFAULT 0,
                unit TEXT DEFAULT '次',
                checkin_date TEXT NOT NULL,
                checkin_time TEXT DEFAULT '',
                is_completed INTEGER DEFAULT 0,
                streak_days INTEGER DEFAULT 0,
                points_earned INTEGER DEFAULT 0,
                note TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_task_id ON {cls.TABLE_NAME}(task_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_checkin_date ON {cls.TABLE_NAME}(checkin_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_date ON {cls.TABLE_NAME}(user_id, checkin_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_task_date ON {cls.TABLE_NAME}(user_id, task_id, checkin_date)"
        db.execute(index_sql)

    def create(self, user_id: int, task_id: int, task_name: str = '', task_icon: str = '',
               target_value: int = 1, current_value: int = 0, unit: str = '次',
               checkin_date: str = '', checkin_time: str = '', is_completed: int = 0,
               streak_days: int = 0, points_earned: int = 0, note: str = '') -> int:
        now = datetime.now()
        if not checkin_date:
            checkin_date = now.strftime('%Y-%m-%d')
        if not checkin_time:
            checkin_time = now.strftime('%H:%M:%S')
        data = {
            'user_id': user_id,
            'task_id': task_id,
            'task_name': task_name,
            'task_icon': task_icon,
            'target_value': target_value,
            'current_value': current_value,
            'unit': unit,
            'checkin_date': checkin_date,
            'checkin_time': checkin_time,
            'is_completed': is_completed,
            'streak_days': streak_days,
            'points_earned': points_earned,
            'note': note,
            'created_at': now.isoformat()
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_today_records(self, user_id: int) -> List[Dict[str, Any]]:
        today = date.today().strftime('%Y-%m-%d')
        return self.query.find_all(
            {'user_id': user_id, 'checkin_date': today},
            order_by='created_at DESC'
        )

    def get_user_date_records(self, user_id: int, checkin_date: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'checkin_date': checkin_date},
            order_by='created_at DESC'
        )

    def get_user_task_date_record(self, user_id: int, task_id: int, checkin_date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'task_id': task_id,
            'checkin_date': checkin_date
        })

    def get_user_date_range_records(self, user_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND checkin_date BETWEEN ? AND ?
            ORDER BY checkin_date DESC, created_at DESC
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def get_user_month_records(self, user_id: int, year: int, month: int) -> List[Dict[str, Any]]:
        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND checkin_date >= ? AND checkin_date < ?
            ORDER BY checkin_date DESC, created_at DESC
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date))

    def update_current_value(self, record_id: int, current_value: int, is_completed: int = 0) -> int:
        data = {
            'current_value': current_value,
            'is_completed': is_completed
        }
        return self.exec.update_by_id(record_id, data)

    def update_streak_and_points(self, record_id: int, streak_days: int, points_earned: int) -> int:
        data = {
            'streak_days': streak_days,
            'points_earned': points_earned
        }
        return self.exec.update_by_id(record_id, data)

    def calculate_streak(self, user_id: int, task_id: int) -> int:
        today = date.today()
        streak = 0
        for i in range(365):
            check_date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            record = self.get_user_task_date_record(user_id, task_id, check_date)
            if record and record.get('is_completed') == 1:
                streak += 1
            else:
                break
        return streak

    def get_task_streak(self, user_id: int, task_id: int) -> Dict[str, Any]:
        current_streak = self.calculate_streak(user_id, task_id)

        sql = f"""
            SELECT MAX(streak_days) as max_streak 
            FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND task_id = ? AND is_completed = 1
        """
        result = self.db.fetch_one(sql, (user_id, task_id))
        max_streak = result.get('max_streak', 0) if result else 0

        return {
            'current_streak': current_streak,
            'max_streak': max_streak
        }

    def get_user_heatmap_data(self, user_id: int, start_date: str, end_date: str) -> Dict[str, int]:
        records = self.get_user_date_range_records(user_id, start_date, end_date)
        heatmap = {}
        for record in records:
            if record.get('is_completed') == 1:
                date_str = record.get('checkin_date', '')
                heatmap[date_str] = heatmap.get(date_str, 0) + 1
        return heatmap

    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_checkins,
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_count,
                SUM(points_earned) as total_points,
                COUNT(DISTINCT checkin_date) as active_days
            FROM {self.TABLE_NAME} 
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if not result:
            return {
                'total_checkins': 0,
                'completed_count': 0,
                'total_points': 0,
                'active_days': 0,
                'completion_rate': 0
            }

        total_checkins = result.get('total_checkins', 0)
        completed_count = result.get('completed_count', 0)
        completion_rate = round(completed_count / total_checkins * 100, 1) if total_checkins > 0 else 0

        return {
            'total_checkins': total_checkins,
            'completed_count': completed_count,
            'total_points': result.get('total_points', 0),
            'active_days': result.get('active_days', 0),
            'completion_rate': completion_rate
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'task_id': record.get('task_id'),
            'task_name': record.get('task_name'),
            'task_icon': record.get('task_icon'),
            'target_value': record.get('target_value'),
            'current_value': record.get('current_value'),
            'unit': record.get('unit'),
            'checkin_date': record.get('checkin_date'),
            'checkin_time': record.get('checkin_time'),
            'is_completed': record.get('is_completed'),
            'streak_days': record.get('streak_days'),
            'points_earned': record.get('points_earned'),
            'note': record.get('note'),
            'created_at': record.get('created_at')
        }
