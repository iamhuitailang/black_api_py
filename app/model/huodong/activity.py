from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_huodong_model_activities'

    STATUS_DRAFT = 0
    STATUS_PENDING = 1
    STATUS_ONGOING = 2
    STATUS_COMPLETED = 3
    STATUS_CANCELLED = 4

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
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT NOT NULL,
                cover_image TEXT DEFAULT '',
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                location_name TEXT DEFAULT '',
                location_address TEXT DEFAULT '',
                latitude REAL DEFAULT 0,
                longitude REAL DEFAULT 0,
                max_participants INTEGER DEFAULT 0,
                current_participants INTEGER DEFAULT 0,
                is_free INTEGER DEFAULT 1,
                fee TEXT DEFAULT '',
                status INTEGER DEFAULT 1,
                is_featured INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                is_checked INTEGER DEFAULT 1,
                tags TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_featured ON {cls.TABLE_NAME}(is_featured)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_checked ON {cls.TABLE_NAME}(is_checked)"
        db.execute(index_sql)

    def create(self, user_id: int, title: str, category: str, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'title': title,
            'description': kwargs.get('description', ''),
            'category': category,
            'cover_image': kwargs.get('cover_image', ''),
            'start_time': kwargs.get('start_time'),
            'end_time': kwargs.get('end_time'),
            'location_name': kwargs.get('location_name', ''),
            'location_address': kwargs.get('location_address', ''),
            'latitude': kwargs.get('latitude', 0),
            'longitude': kwargs.get('longitude', 0),
            'max_participants': kwargs.get('max_participants', 0),
            'current_participants': 0,
            'is_free': kwargs.get('is_free', 1),
            'fee': kwargs.get('fee', ''),
            'status': kwargs.get('status', self.STATUS_PENDING),
            'is_featured': kwargs.get('is_featured', 0),
            'view_count': 0,
            'is_checked': 1,
            'tags': kwargs.get('tags', ''),
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, activity_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'category', 'cover_image',
            'start_time', 'end_time', 'location_name', 'location_address',
            'latitude', 'longitude', 'max_participants', 'is_free', 'fee',
            'status', 'is_featured', 'tags'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(activity_id, update_data)

    def update_status(self, activity_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(activity_id, data)

    def update_check_status(self, activity_id: int, is_checked: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_checked': is_checked,
            'updated_at': now
        }
        return self.exec.update_by_id(activity_id, data)

    def increment_view_count(self, activity_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def increment_participants(self, activity_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_participants = current_participants + 1, updated_at = '{datetime.now().isoformat()}' WHERE id = ? AND (max_participants = 0 OR current_participants < max_participants)"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def decrement_participants(self, activity_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_participants = CASE WHEN current_participants > 0 THEN current_participants - 1 ELSE 0 END, updated_at = '{datetime.now().isoformat()}' WHERE id = ?"
        cursor = self.db.execute(sql, (activity_id,))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10,
                 category: str = None, status: int = None, is_checked: int = None,
                 keyword: str = None, city: str = None, is_featured: int = None,
                 order_by: str = 'created_at DESC') -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        if is_checked is not None:
            conditions['is_checked'] = is_checked
        if is_featured is not None:
            conditions['is_featured'] = is_featured
        if keyword or city:
            return self.search(keyword, page, page_size, category, status, is_checked, city, is_featured, order_by)
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def search(self, keyword: str = None, page: int = 1, page_size: int = 10,
               category: str = None, status: int = None, is_checked: int = None,
               city: str = None, is_featured: int = None,
               order_by: str = 'created_at DESC') -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if category:
            where_clauses.append("category = ?")
            params.append(category)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if is_checked is not None:
            where_clauses.append("is_checked = ?")
            params.append(is_checked)
        if is_featured is not None:
            where_clauses.append("is_featured = ?")
            params.append(is_featured)
        if keyword:
            where_clauses.append("(title LIKE ? OR description LIKE ? OR tags LIKE ? OR location_name LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern, like_pattern, like_pattern])
        if city:
            where_clauses.append("(location_address LIKE ? OR location_name LIKE ?)")
            city_pattern = f"%{city}%"
            params.extend([city_pattern, city_pattern])
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0
        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY is_featured DESC, {order_by}
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

    def get_nearby(self, latitude: float, longitude: float, radius_km: float = 10,
                   page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        lat_diff = radius_km / 111.0
        lon_diff = radius_km / (111.0 * abs(latitude) if latitude != 0 else 111.0)
        sql = f"""
            SELECT *, 
                ({latitude} - latitude) * ({latitude} - latitude) + 
                ({longitude} - longitude) * ({longitude} - longitude) as distance_sq
            FROM {self.TABLE_NAME}
            WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
            AND status = ? AND is_checked = 1
            ORDER BY distance_sq ASC
            LIMIT {page_size} OFFSET {offset}
        """
        params = (
            latitude - lat_diff, latitude + lat_diff,
            longitude - lon_diff, longitude + lon_diff,
            self.STATUS_PENDING
        )
        items = self.db.fetch_all(sql, params)
        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
            AND status = ? AND is_checked = 1
        """
        total_result = self.db.fetch_one(count_sql, params)
        total = total_result['total'] if total_result else 0
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_featured(self, limit: int = 5) -> list:
        conditions = {'is_featured': 1, 'is_checked': 1, 'status': self.STATUS_PENDING}
        return self.query.find_all(conditions, order_by='created_at DESC', limit=limit)

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_PENDING: '报名中',
            self.STATUS_ONGOING: '进行中',
            self.STATUS_COMPLETED: '已结束',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def to_dict(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.huodong.category import CategoryModel
        cat_model = CategoryModel()
        return {
            'id': activity.get('id'),
            'user_id': activity.get('user_id'),
            'title': activity.get('title'),
            'description': activity.get('description'),
            'category': activity.get('category'),
            'category_name': cat_model.get_name_by_code(activity.get('category', '')),
            'category_icon': cat_model.get_icon_by_code(activity.get('category', '')),
            'cover_image': activity.get('cover_image'),
            'start_time': activity.get('start_time'),
            'end_time': activity.get('end_time'),
            'location_name': activity.get('location_name'),
            'location_address': activity.get('location_address'),
            'latitude': activity.get('latitude'),
            'longitude': activity.get('longitude'),
            'max_participants': activity.get('max_participants'),
            'current_participants': activity.get('current_participants'),
            'is_free': activity.get('is_free'),
            'fee': activity.get('fee'),
            'status': activity.get('status'),
            'status_text': self.get_status_text(activity.get('status')),
            'is_featured': activity.get('is_featured'),
            'view_count': activity.get('view_count'),
            'tags': activity.get('tags', ''),
            'created_at': activity.get('created_at'),
            'updated_at': activity.get('updated_at')
        }
