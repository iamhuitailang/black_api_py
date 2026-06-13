from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

from app.model.training import (
    EmployeeModel, CourseModel, EnrollmentModel,
    QuizModel, QuizResultModel, LeaveRequestModel
)


class TrainingBusiness:
    def __init__(self):
        self.employee_model = EmployeeModel()
        self.course_model = CourseModel()
        self.enrollment_model = EnrollmentModel()
        self.quiz_model = QuizModel()
        self.quiz_result_model = QuizResultModel()
        self.leave_model = LeaveRequestModel()

    def _success(self, data: Any = None, message: str = 'success') -> Dict[str, Any]:
        return {'code': 0, 'message': message, 'data': data}

    def _error(self, message: str, code: int = 1) -> Dict[str, Any]:
        return {'code': code, 'message': message, 'data': None}

    def init_demo_data(self):
        self.employee_model.init_default_employees()
        self._migrate_passwords()
        return self._success(message='Demo data initialized')

    def _migrate_passwords(self):
        all_emps = self.employee_model.get_all()
        for emp in all_emps:
            if not emp.get('password'):
                self.employee_model.update(emp['id'], password=emp['employee_id'])

    def login(self, employee_id: str, password: str) -> Dict[str, Any]:
        if not employee_id or not password:
            return self._error('工号和密码不能为空')
        employee = self.employee_model.login(employee_id, password)
        if not employee:
            return self._error('工号或密码错误')
        return self._success(employee, '登录成功')

    def get_employees(self) -> Dict[str, Any]:
        employees = self.employee_model.get_all()
        return self._success(employees)

    def get_departments(self) -> Dict[str, Any]:
        departments = self.employee_model.get_departments()
        return self._success(departments)

    def get_employee_by_id(self, employee_id: int) -> Dict[str, Any]:
        emp = self.employee_model.get_by_id(employee_id)
        if not emp:
            return self._error('Employee not found')
        return self._success(emp)

    def create_employee(self, employee_id: str, name: str, department: str, role: str = 'employee') -> Dict[str, Any]:
        if not employee_id or not name or not department:
            return self._error('employee_id, name, department are required')
        existing = self.employee_model.get_by_employee_id(employee_id)
        if existing:
            return self._error('Employee ID already exists')
        new_id = self.employee_model.create(employee_id, name, department, role)
        emp = self.employee_model.get_by_id(new_id)
        return self._success(emp, 'Employee created successfully')

    def create_course(self, title: str, description: str, instructor: str, datetime_str: str,
                      location: str, link: str, capacity: int, departments: list) -> Dict[str, Any]:
        if not title or not datetime_str:
            return self._error('title and datetime are required')
        if not isinstance(departments, list) or len(departments) == 0:
            return self._error('At least one department is required')

        course_id = self.course_model.create(
            title=title, description=description, instructor=instructor,
            datetime_str=datetime_str, location=location, link=link,
            capacity=capacity, departments=departments
        )

        for dept in departments:
            dept_employees = self.employee_model.get_by_department(dept)
            for emp in dept_employees:
                existing = self.enrollment_model.get_by_course_and_employee(course_id, emp['id'])
                if not existing:
                    self.enrollment_model.create(course_id, emp['id'], EnrollmentModel.STATUS_PENDING)

        course = self.course_model.get_by_id(course_id)
        return self._success(course, 'Course created and employees notified successfully')

    def get_courses(self, status: str = None) -> Dict[str, Any]:
        courses = self.course_model.get_all(status)
        for course in courses:
            total = self.enrollment_model.count_by_course_and_status(course['id'])
            checked_in = self.enrollment_model.count_by_course_and_status(course['id'], EnrollmentModel.STATUS_CHECKED_IN)
            completed = self.enrollment_model.count_by_course_and_status(course['id'], EnrollmentModel.STATUS_COMPLETED)
            course['enrolled_count'] = total
            course['checked_in_count'] = checked_in
            course['completed_count'] = completed
            course['attendance_rate'] = round((checked_in / total * 100), 1) if total > 0 else 0
        return self._success(courses)

    def get_course(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return self._error('Course not found')
        enrollments = self.enrollment_model.get_course_employees_with_detail(course_id)
        course['enrollments'] = enrollments
        total = len(enrollments)
        checked_in = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_CHECKED_IN)
        course['attendance_rate'] = round((checked_in / total * 100), 1) if total > 0 else 0
        return self._success(course)

    def update_course(self, course_id: int, **kwargs) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return self._error('Course not found')
        self.course_model.update(course_id, **kwargs)
        updated = self.course_model.get_by_id(course_id)
        return self._success(updated, 'Course updated successfully')

    def delete_course(self, course_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return self._error('Course not found')
        self.enrollment_model.exec.delete({'course_id': course_id})
        self.quiz_model.delete_by_course_id(course_id)
        self.leave_model.exec.delete({'course_id': course_id})
        self.course_model.delete(course_id)
        return self._success(message='Course deleted successfully')

    def get_employee_courses(self, employee_id: int) -> Dict[str, Any]:
        courses = self.enrollment_model.get_employee_courses_with_detail(employee_id)
        for c in courses:
            quiz_result = self.quiz_result_model.get_by_enrollment_id(c['id'])
            c['quiz_result'] = quiz_result
        return self._success(courses)

    def confirm_attendance(self, enrollment_id: int) -> Dict[str, Any]:
        enrollment = self.enrollment_model.get_by_id(enrollment_id)
        if not enrollment:
            return self._error('Enrollment not found')
        if enrollment['status'] == EnrollmentModel.STATUS_LEAVE:
            return self._error('Cannot confirm: leave request already submitted')
        self.enrollment_model.update_status(enrollment_id, EnrollmentModel.STATUS_CONFIRMED)
        updated = self.enrollment_model.get_by_id(enrollment_id)
        return self._success(updated, 'Attendance confirmed')

    def request_leave(self, enrollment_id: int, reason: str) -> Dict[str, Any]:
        if not reason or not reason.strip():
            return self._error('Leave reason is required')
        enrollment = self.enrollment_model.get_by_id(enrollment_id)
        if not enrollment:
            return self._error('Enrollment not found')
        self.enrollment_model.update_status(enrollment_id, EnrollmentModel.STATUS_LEAVE)
        self.leave_model.create(
            enrollment_id=enrollment_id,
            course_id=enrollment['course_id'],
            employee_id=enrollment['employee_id'],
            reason=reason.strip()
        )
        return self._success(message='Leave request submitted')

    def get_leave_requests(self, status: str = None) -> Dict[str, Any]:
        requests = self.leave_model.get_with_details(status)
        return self._success(requests)

    def approve_leave(self, leave_id: int) -> Dict[str, Any]:
        leave = self.leave_model.get_by_id(leave_id)
        if not leave:
            return self._error('Leave request not found')
        self.leave_model.update_status(leave_id, LeaveRequestModel.STATUS_APPROVED)
        return self._success(message='Leave approved')

    def reject_leave(self, leave_id: int) -> Dict[str, Any]:
        leave = self.leave_model.get_by_id(leave_id)
        if not leave:
            return self._error('Leave request not found')
        self.leave_model.update_status(leave_id, LeaveRequestModel.STATUS_REJECTED)
        self.enrollment_model.update_status(leave['enrollment_id'], EnrollmentModel.STATUS_PENDING)
        return self._success(message='Leave rejected')

    def check_in(self, enrollment_id: int) -> Dict[str, Any]:
        enrollment = self.enrollment_model.get_by_id(enrollment_id)
        if not enrollment:
            return self._error('Enrollment not found')
        if enrollment['status'] == EnrollmentModel.STATUS_LEAVE:
            return self._error('Cannot check in: on leave')

        course = self.course_model.get_by_id(enrollment['course_id'])
        if not course:
            return self._error('Course not found')

        try:
            course_time = datetime.fromisoformat(course['datetime'])
        except:
            return self._error('Invalid course datetime')

        now = datetime.now()
        time_diff = abs((now - course_time).total_seconds())

        if time_diff > 30 * 60:
            return self._error(f'Check-in only allowed within 30 minutes of course start (scheduled: {course_time.strftime("%Y-%m-%d %H:%M")})')

        self.enrollment_model.check_in(enrollment_id)
        updated = self.enrollment_model.get_by_id(enrollment_id)
        return self._success(updated, 'Check-in successful')

    def get_course_attendance(self, course_id: int) -> Dict[str, Any]:
        enrollments = self.enrollment_model.get_course_employees_with_detail(course_id)
        total = len(enrollments)
        checked_in = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_CHECKED_IN)
        confirmed = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_CONFIRMED)
        on_leave = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_LEAVE)
        pending = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_PENDING)
        completed = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_COMPLETED)

        return self._success({
            'total': total,
            'checked_in': checked_in,
            'confirmed': confirmed,
            'on_leave': on_leave,
            'pending': pending,
            'completed': completed,
            'attendance_rate': round((checked_in / total * 100), 1) if total > 0 else 0,
            'enrollments': enrollments
        })

    def save_quiz(self, course_id: int, questions: list) -> Dict[str, Any]:
        if not questions or len(questions) == 0:
            return self._error('Questions are required')
        if len(questions) > 10:
            return self._error('Maximum 10 questions allowed')

        for i, q in enumerate(questions):
            if not q.get('question'):
                return self._error(f'Question {i + 1} text is required')
            if not q.get('options') or len(q.get('options', [])) < 2:
                return self._error(f'Question {i + 1} must have at least 2 options')
            if q.get('correct_answer') is None:
                return self._error(f'Question {i + 1} correct answer is required')

        self.quiz_model.upsert(course_id, questions)
        quiz = self.quiz_model.get_by_course_id(course_id)
        return self._success(quiz, 'Quiz saved successfully')

    def get_quiz(self, course_id: int) -> Dict[str, Any]:
        quiz = self.quiz_model.get_by_course_id(course_id)
        return self._success(quiz)

    def get_quiz_for_employee(self, course_id: int, employee_id: int) -> Dict[str, Any]:
        enrollment = self.enrollment_model.get_by_course_and_employee(course_id, employee_id)
        if not enrollment:
            return self._error('You are not enrolled in this course')

        if enrollment['status'] not in [EnrollmentModel.STATUS_CHECKED_IN, EnrollmentModel.STATUS_COMPLETED]:
            return self._error('请先完成签到后再参与测评')

        quiz = self.quiz_model.get_by_course_id(course_id)
        if not quiz:
            return self._success(None)

        existing_result = self.quiz_result_model.get_by_enrollment_id(enrollment['id'])
        if existing_result:
            return self._success({'already_submitted': True, 'score': existing_result['score']})

        safe_questions = []
        for q in quiz['questions']:
            safe_q = {
                'id': q.get('id'),
                'question': q['question'],
                'options': q['options']
            }
            safe_questions.append(safe_q)

        return self._success({'quiz_id': quiz['id'], 'questions': safe_questions, 'enrollment_id': enrollment['id']})

    def submit_quiz(self, enrollment_id: int, answers: list) -> Dict[str, Any]:
        enrollment = self.enrollment_model.get_by_id(enrollment_id)
        if not enrollment:
            return self._error('Enrollment not found')

        if enrollment['status'] not in [EnrollmentModel.STATUS_CHECKED_IN, EnrollmentModel.STATUS_COMPLETED]:
            return self._error('请先完成签到后再参与测评')

        existing = self.quiz_result_model.get_by_enrollment_id(enrollment_id)
        if existing:
            return self._error('Quiz already submitted')

        quiz = self.quiz_model.get_by_course_id(enrollment['course_id'])
        if not quiz:
            return self._error('Quiz not found')

        questions = quiz['questions']
        if len(answers) != len(questions):
            return self._error(f'Expected {len(questions)} answers, got {len(answers)}')

        correct_count = 0
        answer_details = []
        for i, q in enumerate(questions):
            user_answer = answers[i] if i < len(answers) else None
            is_correct = user_answer == q.get('correct_answer')
            if is_correct:
                correct_count += 1
            answer_details.append({
                'question_id': q.get('id'),
                'user_answer': user_answer,
                'correct_answer': q.get('correct_answer'),
                'is_correct': is_correct
            })

        score = round((correct_count / len(questions)) * 100)

        self.quiz_result_model.create(enrollment_id, score, answer_details)

        if enrollment['status'] in [EnrollmentModel.STATUS_CHECKED_IN, EnrollmentModel.STATUS_CONFIRMED]:
            self.enrollment_model.update_status(enrollment_id, EnrollmentModel.STATUS_COMPLETED)

        result = self.quiz_result_model.get_by_enrollment_id(enrollment_id)
        return self._success(result, f'Quiz submitted. Score: {score}')

    def get_employee_profile(self, employee_id: int) -> Dict[str, Any]:
        employee = self.employee_model.get_by_id(employee_id)
        if not employee:
            return self._error('Employee not found')

        enrollments = self.enrollment_model.get_by_employee(employee_id)
        total_courses = len(enrollments)
        completed_courses = sum(1 for e in enrollments if e['status'] == EnrollmentModel.STATUS_COMPLETED)
        checked_in_courses = sum(1 for e in enrollments if e['status'] in [EnrollmentModel.STATUS_CHECKED_IN, EnrollmentModel.STATUS_COMPLETED])
        avg_score = self.quiz_result_model.get_average_score_by_employee(employee_id)
        quiz_results = self.quiz_result_model.get_by_employee(employee_id)

        attendance_rate = round((checked_in_courses / total_courses * 100), 1) if total_courses > 0 else 0

        profile = {
            'employee': employee,
            'statistics': {
                'total_courses': total_courses,
                'completed_courses': completed_courses,
                'checked_in_courses': checked_in_courses,
                'attendance_rate': attendance_rate,
                'average_score': round(avg_score, 1) if avg_score else 0
            },
            'quiz_results': quiz_results
        }
        return self._success(profile)

    def get_statistics(self) -> Dict[str, Any]:
        all_employees = self.employee_model.get_all()
        all_courses = self.course_model.get_all()

        by_department = {}
        dept_employees = {}
        for emp in all_employees:
            dept = emp['department']
            if dept not in by_department:
                by_department[dept] = {
                    'department': dept,
                    'total_employees': 0,
                    'total_enrollments': 0,
                    'checked_in': 0,
                    'completed': 0,
                    'total_score': 0,
                    'quiz_count': 0
                }
                dept_employees[dept] = []
            by_department[dept]['total_employees'] += 1
            dept_employees[dept].append(emp['id'])

        for dept, emp_ids in dept_employees.items():
            for emp_id in emp_ids:
                enrollments = self.enrollment_model.get_by_employee(emp_id)
                by_department[dept]['total_enrollments'] += len(enrollments)
                for e in enrollments:
                    if e['status'] in [EnrollmentModel.STATUS_CHECKED_IN, EnrollmentModel.STATUS_COMPLETED]:
                        by_department[dept]['checked_in'] += 1
                    if e['status'] == EnrollmentModel.STATUS_COMPLETED:
                        by_department[dept]['completed'] += 1
                avg = self.quiz_result_model.get_average_score_by_employee(emp_id)
                if avg:
                    by_department[dept]['total_score'] += avg
                    by_department[dept]['quiz_count'] += 1

        for dept in by_department:
            d = by_department[dept]
            d['attendance_rate'] = round((d['checked_in'] / d['total_enrollments'] * 100), 1) if d['total_enrollments'] > 0 else 0
            d['avg_score'] = round((d['total_score'] / d['quiz_count']), 1) if d['quiz_count'] > 0 else 0

        by_quarter = {}
        for course in all_courses:
            try:
                dt = datetime.fromisoformat(course['datetime'])
                quarter = f"{dt.year}-Q{(dt.month - 1) // 3 + 1}"
                if quarter not in by_quarter:
                    by_quarter[quarter] = {
                        'quarter': quarter,
                        'total_courses': 0,
                        'total_enrollments': 0,
                        'checked_in': 0
                    }
                by_quarter[quarter]['total_courses'] += 1
                total_enroll = self.enrollment_model.count_by_course_and_status(course['id'])
                checked_in = self.enrollment_model.count_by_course_and_status(course['id'], EnrollmentModel.STATUS_CHECKED_IN)
                by_quarter[quarter]['total_enrollments'] += total_enroll
                by_quarter[quarter]['checked_in'] += checked_in
            except:
                pass

        for q in by_quarter:
            qd = by_quarter[q]
            qd['attendance_rate'] = round((qd['checked_in'] / qd['total_enrollments'] * 100), 1) if qd['total_enrollments'] > 0 else 0

        by_course = []
        for course in all_courses:
            total = self.enrollment_model.count_by_course_and_status(course['id'])
            checked_in = self.enrollment_model.count_by_course_and_status(course['id'], EnrollmentModel.STATUS_CHECKED_IN)
            completed = self.enrollment_model.count_by_course_and_status(course['id'], EnrollmentModel.STATUS_COMPLETED)
            by_course.append({
                'course_id': course['id'],
                'title': course['title'],
                'instructor': course['instructor'],
                'datetime': course['datetime'],
                'total_enrollments': total,
                'checked_in': checked_in,
                'completed': completed,
                'attendance_rate': round((checked_in / total * 100), 1) if total > 0 else 0
            })

        return self._success({
            'overview': {
                'total_employees': len(all_employees),
                'total_courses': len(all_courses),
                'total_enrollments': self.enrollment_model.query.count(),
                'total_quizzes_taken': self.quiz_result_model.query.count()
            },
            'by_department': list(by_department.values()),
            'by_quarter': sorted(list(by_quarter.values()), key=lambda x: x['quarter']),
            'by_course': by_course
        })

    def generate_certificate_html(self, employee_id: int, course_id: int) -> str:
        employee = self.employee_model.get_by_id(employee_id)
        course = self.course_model.get_by_id(course_id)
        enrollment = self.enrollment_model.get_by_course_and_employee(course_id, employee_id)
        quiz_result = self.quiz_result_model.get_by_enrollment_id(enrollment['id']) if enrollment else None

        if not employee or not course:
            return ''

        status_text = '已完成' if enrollment and enrollment['status'] == EnrollmentModel.STATUS_COMPLETED else '已参加'
        score_text = f'{quiz_result["score"]}分' if quiz_result else '未测评'

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: "SimSun", "Songti SC", serif;
                    margin: 0;
                    padding: 40px;
                    background: #fff;
                }}
                .certificate {{
                    border: 8px double #2c5282;
                    padding: 60px 40px;
                    text-align: center;
                    min-height: 600px;
                }}
                .title {{
                    font-size: 42px;
                    color: #2c5282;
                    letter-spacing: 10px;
                    margin-bottom: 40px;
                    font-weight: bold;
                }}
                .subtitle {{
                    font-size: 18px;
                    color: #4a5568;
                    margin-bottom: 50px;
                }}
                .content {{
                    font-size: 18px;
                    line-height: 2.5;
                    color: #2d3748;
                    text-align: left;
                    margin: 0 auto;
                    max-width: 600px;
                }}
                .content span {{
                    font-weight: bold;
                    color: #2c5282;
                    border-bottom: 1px solid #2c5282;
                    padding: 0 10px;
                    min-width: 80px;
                    display: inline-block;
                }}
                .info-row {{
                    margin: 15px 0;
                }}
                .footer {{
                    margin-top: 80px;
                    text-align: right;
                    font-size: 16px;
                    color: #4a5568;
                }}
                .seal {{
                    margin-top: 30px;
                    font-size: 20px;
                    color: #c53030;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="title">培训结业证书</div>
                <div class="subtitle">TRAINING CERTIFICATE</div>
                <div class="content">
                    <div class="info-row">兹证明 <span>{employee['name']}</span> 同志，</div>
                    <div class="info-row">员工编号：<span>{employee['employee_id']}</span></div>
                    <div class="info-row">所属部门：<span>{employee['department']}</span></div>
                    <div class="info-row">于 <span>{course['datetime'][:10]}</span> 参加了</div>
                    <div class="info-row">培训课程：<span>{course['title']}</span></div>
                    <div class="info-row">授课讲师：<span>{course['instructor'] or '-'}</span></div>
                    <div class="info-row">培训状态：<span>{status_text}</span></div>
                    <div class="info-row">测评成绩：<span>{score_text}</span></div>
                </div>
                <div class="footer">
                    <div>人力资源部</div>
                    <div class="seal">公章</div>
                    <div style="margin-top: 20px;">{datetime.now().strftime('%Y年%m月%d日')}</div>
                </div>
            </div>
        </body>
        </html>
        """
        return html
