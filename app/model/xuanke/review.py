from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ReviewModel:
    TABLE_NAME = 'tb_xuanke_reviews'

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
                rating INTEGER NOT NULL DEFAULT 5,
                content TEXT DEFAULT '',
                is_anonymous INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_course_id ON {cls.TABLE_NAME}(course_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rating ON {cls.TABLE_NAME}(rating)"
        db.execute(index_sql)

    def create(self, user_id: int, course_id: int, course_code: str,
               course_name: str, rating: int, content: str = '',
               is_anonymous: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'course_id': course_id,
            'course_code': course_code,
            'course_name': course_name,
            'rating': rating,
            'content': content,
            'is_anonymous': 1 if is_anonymous else 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_course(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'course_id': course_id})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='created_at DESC')

    def get_by_course_id(self, course_id: int, status: int = 1) -> List[Dict[str, Any]]:
        conditions = {'course_id': course_id}
        if status is not None:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='created_at DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'rating', 'content', 'is_anonymous', 'status'
        ]}
        if 'is_anonymous' in update_data:
            update_data['is_anonymous'] = 1 if update_data['is_anonymous'] else 0
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_course_rating_summary(self, course_id: int) -> Dict[str, Any]:
        reviews = self.get_by_course_id(course_id)
        if not reviews:
            return {
                'avg_rating': 0.0,
                'total_reviews': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }

        total_rating = 0
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

        for review in reviews:
            rating = review.get('rating', 0)
            total_rating += rating
            if 1 <= rating <= 5:
                distribution[rating] += 1

        avg_rating = total_rating / len(reviews) if reviews else 0.0

        return {
            'avg_rating': round(avg_rating, 1),
            'total_reviews': len(reviews),
            'rating_distribution': distribution
        }

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                course_id: int = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if course_id:
            conditions['course_id'] = course_id
        if status is not None:
            conditions['status'] = status

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, review: Dict[str, Any], show_user: bool = True) -> Dict[str, Any]:
        result = {
            'id': review.get('id'),
            'course_id': review.get('course_id'),
            'course_code': review.get('course_code'),
            'course_name': review.get('course_name'),
            'rating': review.get('rating'),
            'content': review.get('content'),
            'is_anonymous': bool(review.get('is_anonymous', 0)),
            'status': review.get('status'),
            'created_at': review.get('created_at')
        }

        if show_user and not review.get('is_anonymous'):
            from app.model.xuanke.user import UserModel
            user_model = UserModel()
            user = user_model.get_by_id(review.get('user_id'))
            if user:
                result['user'] = {
                    'id': user.get('id'),
                    'real_name': user.get('real_name'),
                    'student_no': user.get('student_no')
                }

        return result
