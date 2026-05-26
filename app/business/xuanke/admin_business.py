from typing import Dict, Any, List, Optional
from app.model.xuanke import SelectionRuleModel, UserModel, CourseModel, EnrollmentModel, GradeModel


class XuankeAdminBusiness:
    def __init__(self):
        self.rule_model = SelectionRuleModel()
        self.user_model = UserModel()
        self.course_model = CourseModel()
        self.enrollment_model = EnrollmentModel()
        self.grade_model = GradeModel()

    def get_all_rules(self) -> Dict[str, Any]:
        rules = self.rule_model.get_all()
        items = [self.rule_model.to_public_dict(r) for r in rules]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_rule(self, rule_key_or_id, rule_value: Any) -> Dict[str, Any]:
        if isinstance(rule_key_or_id, int):
            rule = self.rule_model.get_by_id(rule_key_or_id)
            if rule:
                rule_key_or_id = rule.get('rule_key')
        
        rule = self.rule_model.get_by_key(rule_key_or_id)
        if not rule:
            return {
                'code': 1,
                'msg': '规则不存在',
                'data': None
            }

        affected = self.rule_model.set_value(rule_key_or_id, rule_value)
        if affected > 0:
            updated = self.rule_model.get_by_key(rule_key_or_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.rule_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def set_selection_phase(self, phase: str) -> Dict[str, Any]:
        valid_phases = [
            SelectionRuleModel.PHASE_PRESELECTION,
            SelectionRuleModel.PHASE_LOTTERY,
            SelectionRuleModel.PHASE_REGULAR,
            SelectionRuleModel.PHASE_ADD_DROP,
            SelectionRuleModel.PHASE_CLOSED
        ]

        if phase not in valid_phases:
            return {
                'code': 1,
                'msg': '无效的阶段',
                'data': None
            }

        return self.update_rule('current_phase', phase)

    def run_lottery(self) -> Dict[str, Any]:
        current_phase = self.rule_model.get_current_phase()
        if current_phase != SelectionRuleModel.PHASE_LOTTERY:
            return {
                'code': 1,
                'msg': '当前不是抽签阶段',
                'data': None
            }

        courses = self.course_model.query.find_all({'status': CourseModel.STATUS_OPEN})

        success_count = 0
        total_pending = 0

        for course in courses:
            pending_enrollments = self.enrollment_model.query.find_all({
                'course_id': course.get('id'),
                'status': EnrollmentModel.STATUS_LOTTERY
            })

            total_pending += len(pending_enrollments)

            max_students = course.get('max_students', 0)
            enrolled_count = course.get('enrolled_count', 0)
            available = max_students - enrolled_count

            if available <= 0:
                for e in pending_enrollments:
                    self.enrollment_model.update_status(e.get('id'), EnrollmentModel.STATUS_DROPPED)
                continue

            import random
            selected = random.sample(pending_enrollments, min(available, len(pending_enrollments)))

            for e in selected:
                self.enrollment_model.update_status(e.get('id'), EnrollmentModel.STATUS_ENROLLED)
                self.course_model.update_enrolled_count(course.get('id'), 1)
                success_count += 1

            for e in pending_enrollments:
                if e not in selected:
                    self.enrollment_model.update_status(e.get('id'), EnrollmentModel.STATUS_DROPPED)

        self.set_selection_phase(SelectionRuleModel.PHASE_REGULAR)

        return {
            'code': 0,
            'msg': f'抽签完成，共处理{total_pending}个申请，成功选中{success_count}人',
            'data': {
                'total_pending': total_pending,
                'success_count': success_count
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count()
        student_count = self.user_model.query.count({'role': UserModel.ROLE_STUDENT})
        teacher_count = self.user_model.query.count({'role': UserModel.ROLE_TEACHER})
        admin_count = self.user_model.query.count({'role': UserModel.ROLE_ADMIN})

        total_courses = self.course_model.query.count()
        required_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_REQUIRED})
        elective_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_ELECTIVE})
        general_courses = self.course_model.query.count({'course_type': CourseModel.TYPE_GENERAL})

        total_enrollments = self.enrollment_model.query.count({'status': EnrollmentModel.STATUS_ENROLLED})
        total_grades = self.grade_model.query.count()
        total_reviews = self.user_model.query.count()

        avg_credits_sql = """
            SELECT AVG(credit_count) as avg_credits FROM (
                SELECT SUM(c.credits) as credit_count 
                FROM tb_xuanke_enrollments e
                LEFT JOIN tb_xuanke_courses c ON e.course_id = c.id
                WHERE e.status = 'enrolled'
                GROUP BY e.user_id
            )
        """
        avg_result = self.rule_model.db.fetch_one(avg_credits_sql)
        avg_credits = round(avg_result.get('avg_credits', 0), 1) if avg_result else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_students': student_count,
                'total_teachers': teacher_count,
                'total_admins': admin_count,
                'total_users': total_users,
                'total_courses': total_courses,
                'required_courses': required_courses,
                'elective_courses': elective_courses,
                'general_courses': general_courses,
                'total_enrollments': total_enrollments,
                'total_reviews': total_reviews,
                'total_grades': total_grades,
                'avg_credits_per_student': avg_credits
            }
        }

    def export_enrollments(self, course_id: int = None) -> Dict[str, Any]:
        conditions = {'status': EnrollmentModel.STATUS_ENROLLED}
        if course_id:
            conditions['course_id'] = course_id

        enrollments = self.enrollment_model.query.find_all(conditions, order_by='course_id ASC')

        result = []
        for e in enrollments:
            user = self.user_model.get_by_id(e.get('user_id'))
            course = self.course_model.get_by_id(e.get('course_id'))
            result.append({
                'student_no': user.get('student_no', '') if user else '',
                'student_name': user.get('real_name', '') if user else '',
                'department': user.get('department', '') if user else '',
                'major': user.get('major', '') if user else '',
                'class_name': user.get('class_name', '') if user else '',
                'course_code': e.get('course_code', ''),
                'course_name': e.get('course_name', ''),
                'teacher': course.get('teacher', '') if course else '',
                'credits': course.get('credits', 0) if course else 0,
                'schedule': course.get('schedule', '') if course else '',
                'location': course.get('location', '') if course else '',
                'enrolled_at': e.get('created_at', '')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def create_rule(self, rule_key: str, rule_value: str, rule_name: str, description: str = '') -> Dict[str, Any]:
        existing = self.rule_model.get_by_key(rule_key)
        if existing:
            return {
                'code': 1,
                'msg': '规则键已存在',
                'data': None
            }

        rule_id = self.rule_model.create(rule_key, rule_value, rule_name, description)
        if rule_id > 0:
            rule = self.rule_model.get_by_id(rule_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.rule_model.to_public_dict(rule)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def delete_rule(self, rule_id: int) -> Dict[str, Any]:
        rule = self.rule_model.get_by_id(rule_id)
        if not rule:
            return {
                'code': 1,
                'msg': '规则不存在',
                'data': None
            }

        affected = self.rule_model.delete(rule_id)
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
