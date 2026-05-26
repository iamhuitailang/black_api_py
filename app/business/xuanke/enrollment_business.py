from typing import Dict, Any, List, Optional
from app.model.xuanke import EnrollmentModel, CourseModel, SelectionRuleModel, GradeModel, UserModel


class XuankeEnrollmentBusiness:
    def __init__(self):
        self.enrollment_model = EnrollmentModel()
        self.course_model = CourseModel()
        self.rule_model = SelectionRuleModel()
        self.grade_model = GradeModel()
        self.user_model = UserModel()

    def _calculate_user_credits(self, user_id: int) -> int:
        enrollments = self.enrollment_model.get_user_enrollments_with_course(
            user_id, EnrollmentModel.STATUS_ENROLLED
        )
        total_credits = 0
        for e in enrollments:
            total_credits += e.get('credits', 0)
        return total_credits

    def _get_required_course_ids(self) -> List[int]:
        courses = self.course_model.query.find_all({'course_type': CourseModel.TYPE_REQUIRED})
        return [c.get('id') for c in courses]

    def enroll_course(self, user_id: int, course_id: int) -> Dict[str, Any]:
        if not self.rule_model.can_enroll():
            return {
                'code': 1,
                'msg': f'当前处于{self.rule_model.get_phase_text(self.rule_model.get_current_phase())}，无法选课',
                'data': None
            }

        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        existing = self.enrollment_model.get_by_user_and_course(user_id, course_id)
        if existing and existing.get('status') == EnrollmentModel.STATUS_ENROLLED:
            return {
                'code': 1,
                'msg': '您已选择该课程',
                'data': None
            }

        if course.get('status') == CourseModel.STATUS_FULL:
            return {
                'code': 1,
                'msg': '该课程已满',
                'data': None
            }

        if course.get('enrolled_count', 0) >= course.get('max_students', 0):
            return {
                'code': 1,
                'msg': '该课程已满',
                'data': None
            }

        if self.rule_model.get_value('enable_time_conflict_check', True):
            conflict = self.enrollment_model.check_schedule_conflict(
                user_id, course.get('schedule', '')
            )
            if conflict:
                return {
                    'code': 1,
                    'msg': f'时间冲突：与"{conflict.get("course_name")}"上课时间相同',
                    'data': None
                }

        current_credits = self._calculate_user_credits(user_id)
        max_credits = self.rule_model.get_value('max_credits', 28)
        if current_credits + course.get('credits', 0) > max_credits:
            return {
                'code': 1,
                'msg': f'学分超限：当前已选{current_credits}学分，最多可选{max_credits}学分',
                'data': None
            }

        if existing and existing.get('status') == EnrollmentModel.STATUS_DROPPED:
            affected = self.enrollment_model.update_status(
                existing.get('id'), EnrollmentModel.STATUS_ENROLLED
            )
        else:
            affected = self.enrollment_model.create(
                user_id=user_id,
                course_id=course_id,
                course_code=course.get('course_code', ''),
                course_name=course.get('course_name', ''),
                selection_phase=self.rule_model.get_current_phase()
            )

        if affected > 0:
            self.course_model.update_enrolled_count(course_id, 1)
            return {
                'code': 0,
                'msg': '选课成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '选课失败',
            'data': None
        }

    def drop_course(self, user_id: int, course_id: int) -> Dict[str, Any]:
        if not self.rule_model.can_drop():
            return {
                'code': 1,
                'msg': f'当前处于{self.rule_model.get_phase_text(self.rule_model.get_current_phase())}，无法退课',
                'data': None
            }

        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        if self.rule_model.get_value('required_courses_mandatory', True):
            if course.get('course_type') == CourseModel.TYPE_REQUIRED:
                return {
                    'code': 1,
                    'msg': '必修课不可退课',
                    'data': None
                }

        affected = self.enrollment_model.drop_course(user_id, course_id)
        if affected > 0:
            self.course_model.update_enrolled_count(course_id, -1)
            return {
                'code': 0,
                'msg': '退课成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '退课失败，您未选择该课程',
            'data': None
        }

    def get_my_courses(self, user_id: int, status: str = None) -> Dict[str, Any]:
        enrollments = self.enrollment_model.get_user_enrollments_with_course(user_id, status)

        items = []
        for e in enrollments:
            enrollment = self.enrollment_model.to_public_dict(e)

            grade = self.grade_model.get_by_user_and_course(user_id, e.get('course_id'))
            if grade:
                enrollment['score'] = grade.get('score')
                enrollment['grade'] = grade.get('grade')
                enrollment['gpa'] = grade.get('gpa')
            else:
                enrollment['score'] = None
                enrollment['grade'] = '未考试'
                enrollment['gpa'] = None

            items.append(enrollment)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_schedule(self, user_id: int) -> Dict[str, Any]:
        enrollments = self.enrollment_model.get_user_enrollments_with_course(
            user_id, EnrollmentModel.STATUS_ENROLLED
        )

        week_days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        periods = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节', '11-12节']

        schedule_data = {}
        for day in week_days:
            schedule_data[day] = {}
            for period in periods:
                schedule_data[day][period] = None

        for e in enrollments:
            schedule = e.get('schedule', '')
            for day in week_days:
                if schedule.startswith(day):
                    for period in periods:
                        if period in schedule:
                            course_info = {
                                'course_id': e.get('course_id'),
                                'course_code': e.get('course_code'),
                                'course_name': e.get('course_name'),
                                'teacher': e.get('teacher'),
                                'location': e.get('location'),
                                'credits': e.get('credits'),
                                'course_type': e.get('course_type'),
                                'schedule': schedule
                            }
                            schedule_data[day][period] = course_info
                            break
                    break

        current_credits = self._calculate_user_credits(user_id)
        min_credits = self.rule_model.get_value('min_credits', 12)
        max_credits = self.rule_model.get_value('max_credits', 28)

        required_ids = self._get_required_course_ids()
        enrolled_ids = self.enrollment_model.get_user_enrolled_course_ids(user_id)
        required_selected = len([rid for rid in required_ids if rid in enrolled_ids])
        required_total = len(required_ids)

        general_sql = """
            SELECT COUNT(*) as cnt FROM tb_xuanke_enrollments e
            LEFT JOIN tb_xuanke_courses c ON e.course_id = c.id
            WHERE e.user_id = ? AND e.status = ? AND c.course_type = ?
        """
        general_result = self.enrollment_model.db.fetch_one(
            general_sql, (user_id, EnrollmentModel.STATUS_ENROLLED, CourseModel.TYPE_GENERAL)
        )
        general_selected = general_result.get('cnt', 0) if general_result else 0
        general_required = self.rule_model.get_value('general_courses_required', 4)

        statistics = {
            'current_credits': current_credits,
            'min_credits': min_credits,
            'max_credits': max_credits,
            'remaining_credits': max_credits - current_credits,
            'credits_warning': current_credits < min_credits,
            'required_selected': required_selected,
            'required_total': required_total,
            'required_completed': required_selected >= required_total if required_total > 0 else True,
            'general_selected': general_selected,
            'general_required': general_required,
            'general_completed': general_selected >= general_required,
            'course_count': len(enrollments)
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'schedule': schedule_data,
                'week_days': week_days,
                'periods': periods,
                'statistics': statistics,
                'courses': [self.course_model.to_public_dict(e) for e in enrollments]
            }
        }

    def get_course_enrollments(self, course_id: int, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {
                'code': 1,
                'msg': '课程不存在',
                'data': None
            }

        result = self.enrollment_model.get_all(page, page_size, course_id=course_id, status=EnrollmentModel.STATUS_ENROLLED)

        items = []
        for e in result.get('items', []):
            user = self.user_model.get_by_id(e.get('user_id'))
            if user:
                grade = self.grade_model.get_by_user_and_course(user.get('id'), course_id)
                score = grade.get('score') if grade else None
                items.append({
                    'enrollment_id': e.get('id'),
                    'student_id': user.get('id'),
                    'student_no': user.get('student_no', ''),
                    'real_name': user.get('real_name', ''),
                    'department': user.get('department', ''),
                    'major': user.get('major', ''),
                    'class_name': user.get('class_name', ''),
                    'score': score
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_selection_phase(self) -> Dict[str, Any]:
        phase = self.rule_model.get_current_phase()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'phase': phase,
                'phase_text': self.rule_model.get_phase_text(phase),
                'can_enroll': self.rule_model.can_enroll(),
                'can_drop': self.rule_model.can_drop(),
                'current_semester': self.rule_model.get_value('current_semester', '')
            }
        }

    def batch_enroll_required(self, user_id: int) -> Dict[str, Any]:
        if not self.rule_model.can_enroll():
            return {
                'code': 1,
                'msg': f'当前处于{self.rule_model.get_phase_text(self.rule_model.get_current_phase())}，无法选课',
                'data': None
            }

        required_courses = self.course_model.query.find_all({'course_type': CourseModel.TYPE_REQUIRED})
        enrolled_ids = self.enrollment_model.get_user_enrolled_course_ids(user_id)

        success_count = 0
        fail_count = 0
        messages = []

        for course in required_courses:
            if course.get('id') in enrolled_ids:
                continue

            result = self.enroll_course(user_id, course.get('id'))
            if result.get('code') == 0:
                success_count += 1
            else:
                fail_count += 1
                messages.append(f"{course.get('course_name')}: {result.get('msg')}")

        return {
            'code': 0,
            'msg': f'一键选课完成，成功{success_count}门，失败{fail_count}门',
            'data': {
                'success_count': success_count,
                'fail_count': fail_count,
                'messages': messages
            }
        }
