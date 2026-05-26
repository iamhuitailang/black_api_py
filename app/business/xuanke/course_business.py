from typing import Dict, Any, List, Optional
from app.model.xuanke import CourseModel, EnrollmentModel, ReviewModel, SelectionRuleModel


class XuankeCourseBusiness:
    def __init__(self):
        self.course_model = CourseModel()
        self.enrollment_model = EnrollmentModel()
        self.review_model = ReviewModel()
        self.rule_model = SelectionRuleModel()

    def get_course_list(self, page: int = 1, page_size: int = 10,
                        course_type: str = None, teacher: str = None,
                        status: str = None, keyword: str = None,
                        schedule: str = None, credits: int = None,
                        user_id: int = None) -> Dict[str, Any]:
        result = self.course_model.get_all(
            page, page_size, course_type, teacher, status,
            keyword, schedule, credits
        )

        enrolled_ids = []
        if user_id:
            enrolled_ids = self.enrollment_model.get_user_enrolled_course_ids(user_id)

        items = []
        for course in result.get('items', []):
            is_enrolled = course.get('id') in enrolled_ids
            items.append(self.course_model.to_public_dict(course, is_enrolled))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_course_detail(self, course_id: int, user_id: int = None) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        is_enrolled = False
        if user_id:
            is_enrolled = self.enrollment_model.get_by_user_and_course(user_id, course_id) is not None

        result = self.course_model.to_public_dict(course, is_enrolled)

        rating_summary = self.review_model.get_course_rating_summary(course_id)
        result['rating_summary'] = rating_summary

        reviews = self.review_model.get_by_course_id(course_id)
        result['reviews'] = [self.review_model.to_public_dict(r) for r in reviews[:10]]

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_all_courses(self, user_id: int = None) -> Dict[str, Any]:
        courses = self.course_model.get_all_courses()

        enrolled_ids = []
        if user_id:
            enrolled_ids = self.enrollment_model.get_user_enrolled_course_ids(user_id)

        items = [self.course_model.to_public_dict(c, c.get('id') in enrolled_ids) for c in courses]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def create_course(self, data: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.course_model.get_by_course_code(data.get('course_code', ''))
        if existing:
            return {
                'code': 1,
                'msg': '课程代码已存在',
                'data': None
            }

        course_id = self.course_model.create(
            course_code=data.get('course_code', ''),
            course_name=data.get('course_name', ''),
            teacher=data.get('teacher', ''),
            credits=data.get('credits', 0),
            hours=data.get('hours', 0),
            max_students=data.get('max_students', 0),
            schedule=data.get('schedule', ''),
            location=data.get('location', ''),
            course_type=data.get('course_type', CourseModel.TYPE_ELECTIVE),
            description=data.get('description', ''),
            syllabus=data.get('syllabus', ''),
            assessment=data.get('assessment', ''),
            textbook=data.get('textbook', ''),
            prerequisites=data.get('prerequisites', ''),
            semester=data.get('semester', self.rule_model.get_value('current_semester', ''))
        )

        if course_id > 0:
            course = self.course_model.get_by_id(course_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.course_model.to_public_dict(course)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_course(self, course_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        if 'course_code' in data and data['course_code'] != course.get('course_code'):
            existing = self.course_model.get_by_course_code(data['course_code'])
            if existing:
                return {
                    'code': 1,
                    'msg': '课程代码已存在',
                    'data': None
                }

        affected = self.course_model.update(course_id, data)
        if affected >= 0:
            updated_course = self.course_model.get_by_id(course_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.course_model.to_public_dict(updated_course)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_course(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        enrollments = self.enrollment_model.get_by_course_id(course_id)
        if enrollments:
            return {
                'code': 1,
                'msg': '该课程已有学生选课，无法删除',
                'data': None
            }

        affected = self.course_model.delete(course_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_teachers(self) -> Dict[str, Any]:
        sql = "SELECT DISTINCT teacher FROM tb_xuanke_courses WHERE teacher IS NOT NULL AND teacher != '' ORDER BY teacher"
        teachers = self.course_model.db.fetch_all(sql)
        return {
            'code': 0,
            'msg': 'success',
            'data': [t.get('teacher') for t in teachers]
        }

    def get_statistics(self) -> Dict[str, Any]:
        total_courses = self.course_model.query.count()
        required_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_REQUIRED})
        elective_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_ELECTIVE})
        general_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_GENERAL})
        open_courses = self.course_model.query.count({'status': CourseModel.STATUS_OPEN})
        full_courses = self.course_model.query.count({'status': CourseModel.STATUS_FULL})

        total_enrollments = self.enrollment_model.query.count({'status': EnrollmentModel.STATUS_ENROLLED})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_courses': total_courses,
                'required_courses': required_courses,
                'elective_courses': elective_courses,
                'general_courses': general_courses,
                'open_courses': open_courses,
                'full_courses': full_courses,
                'total_enrollments': total_enrollments
            }
        }
