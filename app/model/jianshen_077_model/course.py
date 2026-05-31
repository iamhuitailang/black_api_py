from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CourseModel:
    TABLE_NAME = 'tb_jianshen_077_model_course'

    STATUS_DRAFT = 0
    STATUS_ACTIVE = 1
    STATUS_CANCELLED = 2
    STATUS_COMPLETED = 3

    CATEGORY_YOGA = 'yoga'
    CATEGORY_STRENGTH = 'strength'
    CATEGORY_CARDIO = 'cardio'
    CATEGORY_DANCE = 'dance'
    CATEGORY_BOXING = 'boxing'
    CATEGORY_SWIMMING = 'swimming'
    CATEGORY_PILATES = 'pilates'
    CATEGORY_OTHER = 'other'

    CATEGORIES = [
        {'code': CATEGORY_YOGA, 'name': '瑜伽', 'icon': '🧘'},
        {'code': CATEGORY_STRENGTH, 'name': '力量训练', 'icon': '🏋️'},
        {'code': CATEGORY_CARDIO, 'name': '有氧运动', 'icon': '🏃'},
        {'code': CATEGORY_DANCE, 'name': '舞蹈', 'icon': '💃'},
        {'code': CATEGORY_BOXING, 'name': '拳击', 'icon': '🥊'},
        {'code': CATEGORY_SWIMMING, 'name': '游泳', 'icon': '🏊'},
        {'code': CATEGORY_PILATES, 'name': '普拉提', 'icon': '🤸'},
        {'code': CATEGORY_OTHER, 'name': '其他', 'icon': '🏅'}
    ]

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
                description TEXT DEFAULT '',
                coach TEXT DEFAULT '',
                category TEXT DEFAULT '',
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                max_capacity INTEGER DEFAULT 20,
                current_booking INTEGER DEFAULT 0,
                location TEXT DEFAULT '',
                image TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_coach ON {cls.TABLE_NAME}(coach)"
        db.execute(index_sql)

    def create(self, title: str, description: str = '', coach: str = '',
               category: str = '', start_time: str = '', end_time: str = '',
               max_capacity: int = 20, location: str = '', image: str = '',
               status: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'coach': coach,
            'category': category,
            'start_time': start_time,
            'end_time': end_time,
            'max_capacity': max_capacity,
            'current_booking': 0,
            'location': location,
            'image': image,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, course_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'coach', 'category',
            'start_time', 'end_time', 'max_capacity',
            'location', 'image', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(course_id, update_data)

    def update_status(self, course_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(course_id, data)

    def increment_booking(self, course_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_booking = current_booking + 1, updated_at = ? WHERE id = ? AND current_booking < max_capacity"
        cursor = self.db.execute(sql, (datetime.now().isoformat(), course_id))
        return cursor.rowcount

    def decrement_booking(self, course_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET current_booking = current_booking - 1, updated_at = ? WHERE id = ? AND current_booking > 0"
        cursor = self.db.execute(sql, (datetime.now().isoformat(), course_id))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10,
                 category: str = None, status: int = None,
                 keyword: str = None, coach: str = None) -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status is not None:
            conditions['status'] = status
        if coach:
            conditions['coach'] = coach

        if keyword:
            return self.search(keyword, page, page_size, category, status, coach)

        return self.query.paginate(page, page_size, conditions, order_by='start_time DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               category: str = None, status: int = None, coach: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if coach:
            where_clauses.append("coach = ?")
            params.append(coach)

        where_clauses.append("(title LIKE ? OR description LIKE ? OR coach LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY start_time DESC
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

    def get_active_courses(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': self.STATUS_ACTIVE}, order_by='start_time ASC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_ACTIVE: '报名中',
            self.STATUS_CANCELLED: '已取消',
            self.STATUS_COMPLETED: '已完成'
        }
        return status_map.get(status, '未知')

    def get_category_name(self, category: str) -> str:
        for cat in self.CATEGORIES:
            if cat['code'] == category:
                return cat['name']
        return '其他'

    def to_dict(self, course: Dict[str, Any]) -> Dict[str, Any]:
        remaining = course.get('max_capacity', 0) - course.get('current_booking', 0)
        return {
            'id': course.get('id'),
            'title': course.get('title'),
            'description': course.get('description'),
            'coach': course.get('coach'),
            'category': course.get('category'),
            'category_name': self.get_category_name(course.get('category')),
            'start_time': course.get('start_time'),
            'end_time': course.get('end_time'),
            'max_capacity': course.get('max_capacity'),
            'current_booking': course.get('current_booking'),
            'remaining': remaining,
            'location': course.get('location'),
            'image': course.get('image'),
            'status': course.get('status'),
            'status_text': self.get_status_text(course.get('status')),
            'created_at': course.get('created_at'),
            'updated_at': course.get('updated_at')
        }
