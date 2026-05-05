from typing import Dict, Any, Optional, List
from app.model.qx import RegistrationModel, ActivityModel, UserModel


class QxRegistrationBusiness:
    def __init__(self):
        self.registration_model = RegistrationModel()
        self.activity_model = ActivityModel()
        self.user_model = UserModel()

    def join_activity(self, activity_id: int, user_id: int,
                      emergency_contact: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        existing = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if existing:
            if existing.get('status') == RegistrationModel.STATUS_CANCELLED:
                self.registration_model.update_status(existing.get('id'), RegistrationModel.STATUS_REGISTERED)
                if activity.get('current_people', 0) < activity.get('max_people', 0):
                    self.activity_model.increment_people(activity_id)
                return {
                    'code': 0,
                    'msg': '报名成功',
                    'data': None
                }
            return {
                'code': 1,
                'msg': '已报名此活动',
                'data': None
            }

        current_people = activity.get('current_people', 0)
        max_people = activity.get('max_people', 0)
        if current_people >= max_people:
            return {
                'code': 1,
                'msg': '活动人数已满',
                'data': None
            }

        if activity.get('status') not in [ActivityModel.STATUS_RECRUITING, ActivityModel.STATUS_FULL]:
            return {
                'code': 1,
                'msg': '活动不可报名',
                'data': None
            }

        registration_id = self.registration_model.create(activity_id, user_id, emergency_contact)
        if registration_id > 0:
            self.activity_model.increment_people(activity_id)
            updated_activity = self.activity_model.get_by_id(activity_id)
            if updated_activity and updated_activity.get('current_people', 0) >= updated_activity.get('max_people', 0):
                self.activity_model.update_status(activity_id, ActivityModel.STATUS_FULL)

            return {
                'code': 0,
                'msg': '报名成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '报名失败',
            'data': None
        }

    def cancel_registration(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 1,
                'msg': '未报名此活动',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '已取消报名',
                'data': None
            }

        if activity.get('leader_id') == user_id:
            return {
                'code': 1,
                'msg': '发起人不能取消报名',
                'data': None
            }

        affected = self.registration_model.cancel(registration.get('id'))
        if affected > 0:
            self.activity_model.decrement_people(activity_id)
            updated_activity = self.activity_model.get_by_id(activity_id)
            if updated_activity and updated_activity.get('status') == ActivityModel.STATUS_FULL:
                if updated_activity.get('current_people', 0) < updated_activity.get('max_people', 0):
                    self.activity_model.update_status(activity_id, ActivityModel.STATUS_RECRUITING)

            return {
                'code': 0,
                'msg': '取消报名成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消报名失败',
            'data': None
        }

    def check_in(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 1,
                'msg': '未报名此活动',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '已取消报名',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '已签到',
                'data': None
            }

        affected = self.registration_model.check_in(registration.get('id'))
        if affected > 0:
            return {
                'code': 0,
                'msg': '签到成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '签到失败',
            'data': None
        }

    def get_my_registrations(self, user_id: int, page: int = 1, page_size: int = 10,
                             status: str = None) -> Dict[str, Any]:
        activities = self.registration_model.get_activities_by_user(user_id, status)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': activities,
                'total': len(activities),
                'page': page,
                'page_size': page_size,
                'total_pages': 1
            }
        }

    def get_activity_members(self, activity_id: int, status: str = None) -> Dict[str, Any]:
        users = self.registration_model.get_users_by_activity(activity_id, status)
        result = []
        for user in users:
            result.append({
                'id': user.get('id'),
                'user_id': user.get('user_id'),
                'status': user.get('status'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'level': user.get('level'),
                'bike_type': user.get('bike_type'),
                'emergency_contact': user.get('emergency_contact'),
                'joined_at': user.get('joined_at')
            })
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_registration_status(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'registered': False,
                    'status': None
                }
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'registered': registration.get('status') != RegistrationModel.STATUS_CANCELLED,
                'status': registration.get('status')
            }
        }
