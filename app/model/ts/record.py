from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TsRecordModel:
    TABLE_NAME = 'tb_ts_record'

    STATUS_NORMAL = 0
    STATUS_DELETED = 1

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
                count INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                calories REAL DEFAULT 0.0,
                avg_speed REAL DEFAULT 0.0,
                record_date DATE,
                record_time TIME,
                note TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_record_date ON {cls.TABLE_NAME}(record_date)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql3)

    @staticmethod
    def calculate_calories(count: int, weight: float = 60.0) -> float:
        if count <= 0:
            return 0.0
        per_jump = weight * 0.0004
        return round(count * per_jump, 2)

    @staticmethod
    def calculate_avg_speed(count: int, duration: int) -> float:
        if duration <= 0:
            return 0.0
        duration_minutes = duration / 60.0
        if duration_minutes <= 0:
            return 0.0
        return round(count / duration_minutes, 2)

    def create(self, user_id: int, count: int, duration: int, note: str = '',
               record_date: str = None, record_time: str = None, weight: float = 60.0) -> int:
        now = datetime.now()
        if not record_date:
            record_date = now.strftime('%Y-%m-%d')
        if not record_time:
            record_time = now.strftime('%H:%M:%S')

        calories = self.calculate_calories(count, weight)
        avg_speed = self.calculate_avg_speed(count, duration)
        created_at = now.isoformat()

        data = {
            'user_id': user_id,
            'count': count,
            'duration': duration,
            'calories': calories,
            'avg_speed': avg_speed,
            'record_date': record_date,
            'record_time': record_time,
            'note': note or '',
            'status': self.STATUS_NORMAL,
            'created_at': created_at
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_date(self, user_id: int, record_date: str) -> List[Dict[str, Any]]:
        conditions = {
            'user_id': user_id,
            'record_date': record_date,
            'status': self.STATUS_NORMAL
        }
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_daily_total(self, user_id: int, record_date: str) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                SUM(count) as total_count,
                SUM(duration) as total_duration,
                SUM(calories) as total_calories,
                COUNT(*) as record_count
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND record_date = ? AND status = ?
        """
        result = self.db.fetch_one(sql, (user_id, record_date, self.STATUS_NORMAL))
        return {
            'total_count': result.get('total_count') or 0,
            'total_duration': result.get('total_duration') or 0,
            'total_calories': result.get('total_calories') or 0.0,
            'record_count': result.get('record_count') or 0
        }

    def get_weekly_total(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                SUM(count) as total_count,
                SUM(duration) as total_duration,
                SUM(calories) as total_calories,
                COUNT(*) as record_count
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND record_date >= ? AND record_date <= ? AND status = ?
        """
        result = self.db.fetch_one(sql, (user_id, start_date, end_date, self.STATUS_NORMAL))
        return {
            'total_count': result.get('total_count') or 0,
            'total_duration': result.get('total_duration') or 0,
            'total_calories': result.get('total_calories') or 0.0,
            'record_count': result.get('record_count') or 0
        }

    def get_monthly_total(self, user_id: int, year_month: str) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                SUM(count) as total_count,
                SUM(duration) as total_duration,
                SUM(calories) as total_calories,
                COUNT(*) as record_count
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND strftime('%Y-%m', record_date) = ? AND status = ?
        """
        result = self.db.fetch_one(sql, (user_id, year_month, self.STATUS_NORMAL))
        return {
            'total_count': result.get('total_count') or 0,
            'total_duration': result.get('total_duration') or 0,
            'total_calories': result.get('total_calories') or 0.0,
            'record_count': result.get('record_count') or 0
        }

    def get_trend_data(self, user_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                record_date,
                SUM(count) as total_count,
                SUM(duration) as total_duration,
                SUM(calories) as total_calories
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND record_date >= ? AND record_date <= ? AND status = ?
            GROUP BY record_date
            ORDER BY record_date ASC
        """
        return self.db.fetch_all(sql, (user_id, start_date, end_date, self.STATUS_NORMAL))

    def get_best_records(self, user_id: int) -> Dict[str, Any]:
        max_count_sql = f"SELECT MAX(count) as max_single_count FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ?"
        max_count_result = self.db.fetch_one(max_count_sql, (user_id, self.STATUS_NORMAL))
        max_single_count = max_count_result.get('max_single_count') or 0

        max_daily_sql = f"""
            SELECT MAX(total) as max_daily_count FROM (
                SELECT SUM(count) as total FROM {self.TABLE_NAME} 
                WHERE user_id = ? AND status = ? GROUP BY record_date
            )
        """
        max_daily_result = self.db.fetch_one(max_daily_sql, (user_id, self.STATUS_NORMAL))
        max_daily_count = max_daily_result.get('max_daily_count') or 0

        max_speed_sql = f"SELECT MAX(avg_speed) as max_speed FROM {self.TABLE_NAME} WHERE user_id = ? AND status = ? AND duration > 0"
        max_speed_result = self.db.fetch_one(max_speed_sql, (user_id, self.STATUS_NORMAL))
        max_speed = max_speed_result.get('max_speed') or 0.0

        return {
            'max_single_count': max_single_count,
            'max_daily_count': max_daily_count,
            'max_speed': max_speed
        }

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        conditions = {
            'user_id': user_id,
            'status': self.STATUS_NORMAL
        }

        if start_date and end_date:
            return self.get_by_date_range(user_id, start_date, end_date, page, page_size)

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_by_date_range(self, user_id: int, start_date: str, end_date: str,
                           page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND record_date >= ? AND record_date <= ? AND status = ?
        """
        total_result = self.db.fetch_one(count_sql, (user_id, start_date, end_date, self.STATUS_NORMAL))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND record_date >= ? AND record_date <= ? AND status = ?
            ORDER BY created_at DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id, start_date, end_date, self.STATUS_NORMAL))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update(self, record_id: int, data: Dict[str, Any], weight: float = 60.0) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'count', 'duration', 'note', 'record_date', 'record_time'
        ]}

        if 'count' in update_data or 'duration' in update_data:
            record = self.get_by_id(record_id)
            if record:
                count = update_data.get('count', record.get('count', 0))
                duration = update_data.get('duration', record.get('duration', 0))
                update_data['calories'] = self.calculate_calories(count, weight)
                update_data['avg_speed'] = self.calculate_avg_speed(count, duration)

        if update_data:
            return self.exec.update_by_id(record_id, update_data)
        return 0

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': self.STATUS_DELETED})

    def hard_delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_NORMAL}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'count': record.get('count'),
            'duration': record.get('duration'),
            'calories': record.get('calories'),
            'avg_speed': record.get('avg_speed'),
            'record_date': record.get('record_date'),
            'record_time': record.get('record_time'),
            'note': record.get('note'),
            'created_at': record.get('created_at')
        }
