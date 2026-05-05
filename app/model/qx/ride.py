from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class RideModel:
    TABLE_NAME = 'tb_qx_rides'

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
                activity_id INTEGER DEFAULT 0,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                distance REAL DEFAULT 0.0,
                duration INTEGER DEFAULT 0,
                avg_speed REAL DEFAULT 0.0,
                max_speed REAL DEFAULT 0.0,
                elevation INTEGER DEFAULT 0,
                route_name TEXT DEFAULT '',
                images TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_activity_id ON {cls.TABLE_NAME}(activity_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_date ON {cls.TABLE_NAME}(date)"
        db.execute(index_sql)

    def create(self, user_id: int, activity_id: int = 0, date: str = None,
               distance: float = 0.0, duration: int = 0, avg_speed: float = 0.0,
               max_speed: float = 0.0, elevation: int = 0, route_name: str = '',
               images: List[str] = None, notes: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'activity_id': activity_id,
            'date': date or now,
            'distance': distance,
            'duration': duration,
            'avg_speed': avg_speed,
            'max_speed': max_speed,
            'elevation': elevation,
            'route_name': route_name,
            'images': json.dumps(images) if images else '',
            'notes': notes,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, ride_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'date', 'distance', 'duration', 'avg_speed', 'max_speed',
            'elevation', 'route_name', 'notes'
        ]}
        if 'images' in data:
            update_data['images'] = json.dumps(data['images']) if data['images'] else ''
        update_data['updated_at'] = now
        return self.exec.update_by_id(ride_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}

        if start_date or end_date:
            return self.get_by_date_range(user_id, page, page_size, start_date, end_date)

        return self.query.paginate(page, page_size, conditions, order_by='date DESC')

    def get_by_date_range(self, user_id: int, page: int = 1, page_size: int = 10,
                          start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["user_id = ?"]
        params = [user_id]

        if start_date:
            where_clauses.append("date >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("date <= ?")
            params.append(end_date + ' 23:59:59')

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY date DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_by_activity(self, activity_id: int) -> List[Dict[str, Any]]:
        return self.query.find_many({'activity_id': activity_id}, order_by='date DESC')

    def get_statistics(self, user_id: int, month: str = None, year: str = None) -> Dict[str, Any]:
        where_clauses = ["user_id = ?"]
        params = [user_id]

        if year:
            where_clauses.append("strftime('%Y', date) = ?")
            params.append(year)

        if month:
            where_clauses.append("strftime('%m', date) = ?")
            params.append(month)

        sql = f"""
            SELECT 
                COUNT(*) as total_rides,
                SUM(distance) as total_distance,
                SUM(duration) as total_duration,
                AVG(avg_speed) as avg_speed,
                MAX(max_speed) as max_speed,
                SUM(elevation) as total_elevation
            FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params))

        total_distance = result.get('total_distance') or 0.0
        total_duration = result.get('total_duration') or 0

        return {
            'total_rides': result.get('total_rides') or 0,
            'total_distance': round(total_distance, 2),
            'total_duration': total_duration,
            'avg_speed': round(result.get('avg_speed') or 0.0, 2),
            'max_speed': round(result.get('max_speed') or 0.0, 2),
            'total_elevation': result.get('total_elevation') or 0
        }

    def get_monthly_statistics(self, user_id: int, year: str) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                strftime('%m', date) as month,
                COUNT(*) as total_rides,
                SUM(distance) as total_distance,
                SUM(duration) as total_duration,
                SUM(elevation) as total_elevation
            FROM {self.TABLE_NAME}
            WHERE user_id = ? AND strftime('%Y', date) = ?
            GROUP BY strftime('%m', date)
            ORDER BY month
        """
        return self.db.fetch_all(sql, (user_id, year))

    def to_dict(self, ride: Dict[str, Any]) -> Dict[str, Any]:
        images = ride.get('images', '')
        if images:
            try:
                images = json.loads(images)
            except:
                images = []
        else:
            images = []

        return {
            'id': ride.get('id'),
            'user_id': ride.get('user_id'),
            'activity_id': ride.get('activity_id'),
            'date': ride.get('date'),
            'distance': ride.get('distance'),
            'duration': ride.get('duration'),
            'avg_speed': ride.get('avg_speed'),
            'max_speed': ride.get('max_speed'),
            'elevation': ride.get('elevation'),
            'route_name': ride.get('route_name'),
            'images': images,
            'notes': ride.get('notes'),
            'created_at': ride.get('created_at'),
            'updated_at': ride.get('updated_at')
        }
