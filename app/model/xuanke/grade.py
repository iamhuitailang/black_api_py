from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GradeModel:
    TABLE_NAME = 'tb_xuanke_grades'

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
                score REAL,
                grade TEXT,
                gpa REAL,
                semester TEXT DEFAULT '',
                comments TEXT DEFAULT '',
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_semester ON {cls.TABLE_NAME}(semester)"
        db.execute(index_sql)

    @staticmethod
    def calculate_gpa(score: float) -> float:
        if score >= 90:
            return 4.0
        elif score >= 85:
            return 3.7
        elif score >= 82:
            return 3.3
        elif score >= 78:
            return 3.0
        elif score >= 75:
            return 2.7
        elif score >= 72:
            return 2.3
        elif score >= 68:
            return 2.0
        elif score >= 64:
            return 1.5
        elif score >= 60:
            return 1.0
        else:
            return 0.0

    @staticmethod
    def get_grade(score: float) -> str:
        if score >= 90:
            return '优'
        elif score >= 80:
            return '良'
        elif score >= 70:
            return '中'
        elif score >= 60:
            return '及格'
        else:
            return '不及格'

    def create(self, user_id: int, course_id: int, course_code: str,
               course_name: str, score: float, semester: str = '',
               comments: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'course_id': course_id,
            'course_code': course_code,
            'course_name': course_name,
            'score': score,
            'grade': self.get_grade(score),
            'gpa': self.calculate_gpa(score),
            'semester': semester,
            'comments': comments,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.upsert(data, ['user_id', 'course_id'])

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_course(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'course_id': course_id})

    def get_by_user_id(self, user_id: int, semester: str = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if semester:
            conditions['semester'] = semester
        return self.query.find_all(conditions, order_by='semester DESC, created_at DESC')

    def get_by_course_id(self, course_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'course_id': course_id}, order_by='score DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {}
        if 'score' in data:
            update_data['score'] = data['score']
            update_data['grade'] = self.get_grade(data['score'])
            update_data['gpa'] = self.calculate_gpa(data['score'])
        if 'semester' in data:
            update_data['semester'] = data['semester']
        if 'comments' in data:
            update_data['comments'] = data['comments']
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def calculate_user_gpa(self, user_id: int, semester: str = None) -> Dict[str, Any]:
        grades = self.get_by_user_id(user_id, semester)
        if not grades:
            return {
                'total_credits': 0,
                'earned_credits': 0,
                'total_gpa_points': 0,
                'gpa': 0.0,
                'course_count': 0,
                'passed_count': 0
            }

        total_credits = 0
        earned_credits = 0
        total_gpa_points = 0
        passed_count = 0

        from app.model.xuanke.course import CourseModel
        course_model = CourseModel()

        for grade in grades:
            course = course_model.get_by_id(grade.get('course_id'))
            credits = course.get('credits', 0) if course else 0
            score = grade.get('score', 0)
            gpa = grade.get('gpa', 0)

            total_credits += credits
            if score >= 60:
                earned_credits += credits
                passed_count += 1
            total_gpa_points += gpa * credits

        gpa = total_gpa_points / total_credits if total_credits > 0 else 0.0

        return {
            'total_credits': total_credits,
            'earned_credits': earned_credits,
            'total_gpa_points': total_gpa_points,
            'gpa': round(gpa, 2),
            'course_count': len(grades),
            'passed_count': passed_count
        }

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                course_id: int = None, semester: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if course_id:
            conditions['course_id'] = course_id
        if semester:
            conditions['semester'] = semester

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_public_dict(self, grade: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': grade.get('id'),
            'user_id': grade.get('user_id'),
            'course_id': grade.get('course_id'),
            'course_code': grade.get('course_code'),
            'course_name': grade.get('course_name'),
            'score': grade.get('score'),
            'grade': grade.get('grade'),
            'gpa': grade.get('gpa'),
            'semester': grade.get('semester'),
            'comments': grade.get('comments'),
            'created_at': grade.get('created_at')
        }

    def get_grade_distribution(self, course_id: int) -> Dict[str, int]:
        grades = self.get_by_course_id(course_id)
        distribution = {
            '优': 0, '良': 0, '中': 0, '及格': 0, '不及格': 0
        }
        for grade in grades:
            g = grade.get('grade', '')
            if g in distribution:
                distribution[g] += 1
        return distribution
