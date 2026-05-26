from typing import Dict, Any, List, Optional
from app.model.xuanke import GradeModel, CourseModel, UserModel, EnrollmentModel


class XuankeGradeBusiness:
    def __init__(self):
        self.grade_model = GradeModel()
        self.course_model = CourseModel()
        self.user_model = UserModel()
        self.enrollment_model = EnrollmentModel()

    def get_my_grades(self, user_id: int, semester: str = None) -> Dict[str, Any]:
        grades = self.grade_model.get_by_user_id(user_id, semester)

        items = []
        for g in grades:
            grade = self.grade_model.to_public_dict(g)
            course = self.course_model.get_by_id(g.get('course_id'))
            if course:
                grade['credits'] = course.get('credits')
                grade['course_type'] = course.get('course_type')
                grade['course_type_text'] = self.course_model.get_type_text(course.get('course_type'))
            items.append(grade)

        gpa_stats = self.grade_model.calculate_user_gpa(user_id, semester)

        semesters_sql = "SELECT DISTINCT semester FROM tb_xuanke_grades WHERE user_id = ? ORDER BY semester DESC"
        semesters_result = self.grade_model.db.fetch_all(semesters_sql, (user_id,))
        semesters = [s.get('semester') for s in semesters_result if s.get('semester')]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'gpa_stats': gpa_stats,
                'semesters': semesters,
                'current_semester': semester
            }
        }

    def get_course_grades(self, course_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        result = self.grade_model.get_all(page, page_size, course_id=course_id)

        items = []
        for g in result.get('items', []):
            grade = self.grade_model.to_public_dict(g)
            user = self.user_model.get_by_id(g.get('user_id'))
            if user:
                grade['user'] = self.user_model.to_public_dict(user)
            items.append(grade)

        distribution = self.grade_model.get_grade_distribution(course_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'course': self.course_model.to_public_dict(course),
                'distribution': distribution
            }
        }

    def input_grade(self, user_id: int, course_id: int, score: float,
                    semester: str = '', comments: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '学生不存在',
                'data': None
            }

        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        enrollment = self.enrollment_model.get_by_user_and_course(user_id, course_id)
        if not enrollment or enrollment.get('status') != EnrollmentModel.STATUS_ENROLLED:
            return {
                'code': 1,
                'msg': '该学生未选择此课程',
                'data': None
            }

        if score < 0 or score > 100:
            return {
                'code': 1,
                'msg': '分数必须在0-100之间',
                'data': None
            }

        affected = self.grade_model.create(
            user_id=user_id,
            course_id=course_id,
            course_code=course.get('course_code', ''),
            course_name=course.get('course_name', ''),
            score=score,
            semester=semester,
            comments=comments
        )

        if affected > 0:
            grade = self.grade_model.get_by_user_and_course(user_id, course_id)
            return {
                'code': 0,
                'msg': '成绩录入成功',
                'data': self.grade_model.to_public_dict(grade)
            }

        return {
            'code': 1,
            'msg': '成绩录入失败',
            'data': None
        }

    def batch_input_grades(self, grades_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        success_count = 0
        fail_count = 0
        messages = []

        for data in grades_data:
            result = self.input_grade(
                user_id=data.get('user_id', 0),
                course_id=data.get('course_id', 0),
                score=data.get('score', 0),
                semester=data.get('semester', ''),
                comments=data.get('comments', '')
            )
            if result.get('code') == 0:
                success_count += 1
            else:
                fail_count += 1
                user = self.user_model.get_by_id(data.get('user_id', 0))
                user_name = user.get('real_name', '') if user else str(data.get('user_id'))
                messages.append(f"{user_name}: {result.get('msg')}")

        return {
            'code': 0,
            'msg': f'批量录入完成，成功{success_count}条，失败{fail_count}条',
            'data': {
                'success_count': success_count,
                'fail_count': fail_count,
                'messages': messages
            }
        }

    def update_grade(self, grade_id: int, score: float, comments: str = '') -> Dict[str, Any]:
        grade = self.grade_model.get_by_id(grade_id)
        if not grade:
            return {
                'code': 1,
                'msg': '成绩记录不存在',
                'data': None
            }

        if score < 0 or score > 100:
            return {
                'code': 1,
                'msg': '分数必须在0-100之间',
                'data': None
            }

        data = {'score': score, 'comments': comments}
        affected = self.grade_model.update(grade_id, data)

        if affected > 0:
            updated = self.grade_model.get_by_id(grade_id)
            return {
                'code': 0,
                'msg': '成绩更新成功',
                'data': self.grade_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '成绩更新失败',
            'data': None
        }

    def delete_grade(self, grade_id: int) -> Dict[str, Any]:
        grade = self.grade_model.get_by_id(grade_id)
        if not grade:
            return {
                'code': 1,
                'msg': '成绩记录不存在',
                'data': None
            }

        affected = self.grade_model.delete(grade_id)
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

    def get_gpa_ranking(self, user_id: int, semester: str = None) -> Dict[str, Any]:
        all_users_sql = "SELECT DISTINCT user_id FROM tb_xuanke_grades"
        if semester:
            all_users_sql += " WHERE semester = ?"
            params = (semester,)
        else:
            params = ()

        all_users = self.grade_model.db.fetch_all(all_users_sql, params)

        user_gpas = []
        for u in all_users:
            uid = u.get('user_id')
            stats = self.grade_model.calculate_user_gpa(uid, semester)
            if stats.get('total_credits', 0) > 0:
                user_info = self.user_model.get_by_id(uid)
                user_gpas.append({
                    'user_id': uid,
                    'real_name': user_info.get('real_name', '') if user_info else '',
                    'student_no': user_info.get('student_no', '') if user_info else '',
                    'gpa': stats.get('gpa', 0),
                    'total_credits': stats.get('total_credits', 0),
                    'course_count': stats.get('course_count', 0)
                })

        user_gpas.sort(key=lambda x: x['gpa'], reverse=True)

        my_rank = None
        my_gpa = None
        for i, ug in enumerate(user_gpas):
            if ug['user_id'] == user_id:
                my_rank = i + 1
                my_gpa = ug
                break

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'my_rank': my_rank,
                'my_gpa': my_gpa,
                'total_students': len(user_gpas),
                'top_10': user_gpas[:10]
            }
        }

    def get_grade_point_table(self) -> Dict[str, Any]:
        table = [
            {'score_range': '90-100', 'grade': '优', 'gpa': '4.0'},
            {'score_range': '85-89', 'grade': '良', 'gpa': '3.7'},
            {'score_range': '82-84', 'grade': '良', 'gpa': '3.3'},
            {'score_range': '78-81', 'grade': '良', 'gpa': '3.0'},
            {'score_range': '75-77', 'grade': '中', 'gpa': '2.7'},
            {'score_range': '72-74', 'grade': '中', 'gpa': '2.3'},
            {'score_range': '68-71', 'grade': '中', 'gpa': '2.0'},
            {'score_range': '64-67', 'grade': '及格', 'gpa': '1.5'},
            {'score_range': '60-63', 'grade': '及格', 'gpa': '1.0'},
            {'score_range': '<60', 'grade': '不及格', 'gpa': '0.0'},
        ]
        return {
            'code': 0,
            'msg': 'success',
            'data': table
        }
