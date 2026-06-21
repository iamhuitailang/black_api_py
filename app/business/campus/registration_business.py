from typing import Dict, Any, List, Optional
from app.model.campus import RegistrationModel, StudentModel, ActivityModel


class RegistrationBusiness:
    def __init__(self):
        self.model = RegistrationModel()
        self.student_model = StudentModel()
        self.activity_model = ActivityModel()

    def register(self, activity_id: int, student_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'message': '活动不存在', 'data': None}
        if activity['status'] != ActivityModel.STATUS_APPROVED:
            return {'code': 1, 'message': '活动未审批通过，无法报名', 'data': None}

        existing = self.model.find_by_activity_and_student(activity_id, student_id)
        if existing and existing['status'] == RegistrationModel.STATUS_REGISTERED:
            return {'code': 1, 'message': '已报名该活动', 'data': None}

        student = self.student_model.get_by_id(student_id)
        if not student:
            return {'code': 1, 'message': '学生不存在', 'data': None}

        if existing:
            self.model.update(existing['id'], {'status': RegistrationModel.STATUS_REGISTERED})
            reg = self.model.get_by_id(existing['id'])
        else:
            new_id = self.model.create({
                'activity_id': activity_id,
                'student_id': student_id,
                'student_name': student['name'],
                'student_no': student['student_no'],
                'department': student['department']
            })
            reg = self.model.get_by_id(new_id)

        return {'code': 0, 'message': '报名成功', 'data': reg}

    def cancel(self, registration_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(registration_id)
        if not record:
            return {'code': 1, 'message': '报名记录不存在', 'data': None}
        self.model.cancel(registration_id)
        return {'code': 0, 'message': '取消报名成功', 'data': None}

    def list_by_activity(self, activity_id: int) -> Dict[str, Any]:
        items = self.model.find_by_activity(activity_id)
        return {'code': 0, 'message': 'success', 'data': items}

    def list_by_student(self, student_id: int) -> Dict[str, Any]:
        items = self.model.find_by_student(student_id)
        result = []
        for item in items:
            activity = self.activity_model.get_by_id(item['activity_id'])
            if activity:
                item['activity'] = activity
            result.append(item)
        return {'code': 0, 'message': 'success', 'data': result}

    def count(self, activity_id: int) -> Dict[str, Any]:
        total = self.model.count_by_activity(activity_id)
        active = self.model.count_by_activity(activity_id, RegistrationModel.STATUS_REGISTERED)
        cancelled = self.model.count_by_activity(activity_id, RegistrationModel.STATUS_CANCELLED)
        return {
            'code': 0,
            'message': 'success',
            'data': {'total': total, 'active': active, 'cancelled': cancelled}
        }
