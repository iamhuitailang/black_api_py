from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.campus import CheckinModel, RegistrationModel, StudentModel, ActivityModel


class CheckinBusiness:
    def __init__(self):
        self.model = CheckinModel()
        self.registration_model = RegistrationModel()
        self.student_model = StudentModel()
        self.activity_model = ActivityModel()

    def do_checkin(self, activity_id: int, student_id: int = None,
                   student_no: str = None, method: str = 'qrcode') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'message': '活动不存在', 'data': None}

        student = None
        if student_id:
            student = self.student_model.get_by_id(student_id)
        elif student_no:
            student = self.student_model.get_by_student_no(student_no)

        if not student:
            return {'code': 1, 'message': '学生不存在', 'data': None}

        registration = self.registration_model.find_by_activity_and_student(
            activity_id, student['id']
        )
        rid = registration['id'] if registration else None

        checkin_id = self.model.create({
            'activity_id': activity_id,
            'registration_id': rid,
            'student_id': student['id'],
            'student_name': student['name'],
            'student_no': student['student_no'],
            'status': CheckinModel.STATUS_CHECKED,
            'checkin_method': method
        })

        checkin = self.model.get_by_id(checkin_id) if isinstance(checkin_id, int) \
            else self.model.find_by_activity_and_student(activity_id, student['id'])

        return {'code': 0, 'message': '签到成功', 'data': checkin}

    def mark_absent_batch(self, activity_id: int) -> Dict[str, Any]:
        registrations = self.registration_model.find_by_activity(
            activity_id, RegistrationModel.STATUS_REGISTERED
        )
        marked = 0
        for r in registrations:
            existing = self.model.find_by_activity_and_student(activity_id, r['student_id'])
            if not existing:
                self.model.mark_absent(activity_id, r['student_id'])
                marked += 1
        return {'code': 0, 'message': f'已标记{marked}名未签到学生为"未出席"', 'data': {'marked_count': marked}}

    def list_by_activity(self, activity_id: int) -> Dict[str, Any]:
        items = self.model.find_by_activity(activity_id)
        return {'code': 0, 'message': 'success', 'data': items}

    def get_stats(self, activity_id: int) -> Dict[str, Any]:
        checkins = self.model.find_by_activity(activity_id)
        checked_count = sum(1 for c in checkins if c['status'] == CheckinModel.STATUS_CHECKED)
        absent_count = sum(1 for c in checkins if c['status'] == CheckinModel.STATUS_ABSENT)
        registered_count = self.registration_model.count_by_activity(
            activity_id, RegistrationModel.STATUS_REGISTERED
        )
        activity = self.activity_model.get_by_id(activity_id)
        expected = activity['expected_count'] if activity else 0

        attendance_rate = 0.0
        if registered_count > 0:
            attendance_rate = round(checked_count / registered_count * 100, 2)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'checked_count': checked_count,
                'absent_count': absent_count,
                'registered_count': registered_count,
                'expected_count': expected,
                'attendance_rate': attendance_rate
            }
        }
