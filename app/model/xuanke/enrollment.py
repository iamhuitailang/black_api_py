from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EnrollmentModel:
    TABLE_NAME = 'tb_xuanke_enrollments'

    STATUS_ENROLLED = 'enrolled'
    STATUS_DROPPED = 'dropped'
    STATUS_PENDING = 'pending'
    STATUS_LOTTERY = 'lottery'

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
                course_id INTEGER NOT NULL,
                course_code TEXT NOT NULL,
                course_name TEXT NOT NULL,
                status TEXT DEFAULT 'enrolled',
                selection_phase TEXT DEFAULT 'regular',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, course_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_code ON {cls.TABLE_NAME}(course_code)"
        db.execute(index_sql)

    def create(self, user_id: int, course_id: int, course_code: str,
               course_name: str, selection_phase: str = 'regular') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'course_id': course_id,
            'course_code': course_code,
            'course_name': course_name,
            'status': self.STATUS_ENROLLED,
            'selection_phase': selection_phase,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_course(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'course_id': course_id})

    def get_by_user_id(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def get_by_course_id(self, course_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'course_id': course_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def update_status(self, record_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def drop_course(self, user_id: int, course_id: int) -> int:
        enrollment = self.get_by_user_and_course(user_id, course_id)
        if not enrollment or enrollment.get('status') != self.STATUS_ENROLLED:
            return 0
        return self.update_status(enrollment.get('id'), self.STATUS_DROPPED)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_enrolled_course_ids(self, user_id: int) -> List[int]:
        enrollments = self.get_by_user_id(user_id, self.STATUS_ENROLLED)
        return [e.get('course_id') for e in enrollments]

    def get_user_enrollments_with_course(self, user_id: int, status: str = None) -> List[Dict[str, Any]]:
        where_status = ""
        params = [user_id]
        if status:
            where_status = "AND e.status = ?"
            params.append(status)

        sql = f"""
            SELECT e.*, c.teacher, c.credits, c.hours, c.max_students, 
                   c.enrolled_count, c.schedule, c.location, c.course_type,
                   c.description, c.syllabus, c.assessment, c.textbook,
                   c.prerequisites, c.semester, c.status as course_status
            FROM {self.TABLE_NAME} e
            LEFT JOIN tb_xuanke_courses c ON e.course_id = c.id
            WHERE e.user_id = ? {where_status}
            ORDER BY e.created_at DESC
        """
        return self.db.fetch_all(sql, tuple(params))

    def check_schedule_conflict(self, user_id: int, new_schedule: str, exclude_course_id: int = None) -> Optional[Dict[str, Any]]:
        enrollments = self.get_by_user_id(user_id, self.STATUS_ENROLLED)
        course_ids = [e.get('course_id') for e in enrollments]
        if exclude_course_id and exclude_course_id in course_ids:
            course_ids.remove(exclude_course_id)

        if not course_ids:
            return None

        placeholders = ','.join(['?' for _ in course_ids])
        params = course_ids + [f"%{new_schedule.split('节')[0]}%"]

        sql = f"""
            SELECT * FROM tb_xuanke_courses 
            WHERE id IN ({placeholders}) AND schedule LIKE ?
            LIMIT 1
        """
        return self.db.fetch_one(sql, tuple(params))

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                course_id: int = None, status: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if course_id:
            conditions['course_id'] = course_id
        if status:
            conditions['status'] = status

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_ENROLLED: '已选',
            self.STATUS_DROPPED: '已退课',
            self.STATUS_PENDING: '待处理',
            self.STATUS_LOTTERY: '抽签中'
        }
        return status_map.get(status, '未知')

    def to_public_dict(self, enrollment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': enrollment.get('id'),
            'user_id': enrollment.get('user_id'),
            'course_id': enrollment.get('course_id'),
            'course_code': enrollment.get('course_code'),
            'course_name': enrollment.get('course_name'),
            'teacher': enrollment.get('teacher'),
            'credits': enrollment.get('credits'),
            'hours': enrollment.get('hours'),
            'schedule': enrollment.get('schedule'),
            'location': enrollment.get('location'),
            'course_type': enrollment.get('course_type'),
            'status': enrollment.get('status'),
            'status_text': self.get_status_text(enrollment.get('status')),
            'selection_phase': enrollment.get('selection_phase'),
            'created_at': enrollment.get('created_at')
        }
