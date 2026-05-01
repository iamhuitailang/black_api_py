from typing import Dict, Any, List, Optional
from app.model.yeyou import RegistrationModel, ActivityModel, UserModel


class RegistrationBusiness:
    def __init__(self):
        self.registration_model = RegistrationModel()
        self.activity_model = ActivityModel()
        self.user_model = UserModel()

    def register_activity(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') == user_id:
            return {
                'code': 1,
                'msg': '不能报名自己发起的活动',
                'data': None
            }

        if activity.get('status') not in [ActivityModel.STATUS_RECRUITING, ActivityModel.STATUS_FULL]:
            return {
                'code': 1,
                'msg': '活动已开始、已结束或已取消',
                'data': None
            }

        existing = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if existing:
            if existing.get('status') == RegistrationModel.STATUS_CANCELLED:
                self.registration_model.update_status(existing.get('id'), RegistrationModel.STATUS_REGISTERED)
                self.activity_model.update_people_count(activity_id, 1)
                return {
                    'code': 0,
                    'msg': '报名成功',
                    'data': None
                }
            return {
                'code': 1,
                'msg': '已报名该活动',
                'data': None
            }

        current_people = activity.get('current_people', 0) or 0
        max_people = activity.get('max_people', 10) or 10
        if current_people >= max_people:
            return {
                'code': 1,
                'msg': '活动人数已满',
                'data': None
            }

        registration_id = self.registration_model.create(activity_id, user_id)
        if registration_id > 0:
            self.activity_model.update_people_count(activity_id, 1)
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

        if activity.get('status') == ActivityModel.STATUS_ONGOING:
            return {
                'code': 1,
                'msg': '活动进行中，无法取消报名',
                'data': None
            }

        if activity.get('status') == ActivityModel.STATUS_FINISHED:
            return {
                'code': 1,
                'msg': '活动已结束，无法取消报名',
                'data': None
            }

        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 1,
                'msg': '未报名该活动',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '已取消报名',
                'data': None
            }

        affected = self.registration_model.cancel(registration.get('id'))
        if affected > 0:
            self.activity_model.update_people_count(activity_id, -1)
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

    def check_in(self, activity_id: int, user_id: int, operator_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') != operator_id:
            return {
                'code': 1,
                'msg': '只有领队才能进行签到操作',
                'data': None
            }

        if activity.get('status') != ActivityModel.STATUS_ONGOING:
            return {
                'code': 1,
                'msg': '只有进行中的活动才能签到',
                'data': None
            }

        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 1,
                'msg': '该用户未报名此活动',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '该用户已取消报名',
                'data': None
            }

        if registration.get('status') == RegistrationModel.STATUS_CHECKED_IN:
            return {
                'code': 1,
                'msg': '该用户已签到',
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

    def get_registration_status(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not registration:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'is_registered': False,
                    'status': None,
                    'status_text': None
                }
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'is_registered': True,
                'status': registration.get('status'),
                'status_text': self.registration_model.get_status_text(registration.get('status'))
            }
        }

    def get_activity_participants(self, activity_id: int, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        result = self.registration_model.get_by_activity(activity_id, page, page_size)

        participants = []
        for reg in result.get('items', []):
            user = self.user_model.get_by_id(reg.get('user_id'))
            if user:
                participants.append({
                    'registration_id': reg.get('id'),
                    'user': self.user_model.to_public_dict(user),
                    'status': reg.get('status'),
                    'status_text': self.registration_model.get_status_text(reg.get('status')),
                    'joined_at': reg.get('joined_at'),
                    'checked_in_at': reg.get('checked_in_at')
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': participants,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_my_registrations(self, user_id: int, page: int = 1, page_size: int = 10,
                              status: str = None) -> Dict[str, Any]:
        result = self.registration_model.get_by_user(user_id, page, page_size, status)

        items = []
        for reg in result.get('items', []):
            activity = self.activity_model.get_by_id(reg.get('activity_id'))
            if activity:
                activity_dict = self.activity_model.to_public_dict(activity)
                activity_dict['registration_status'] = reg.get('status')
                activity_dict['registration_status_text'] = self.registration_model.get_status_text(reg.get('status'))
                activity_dict['joined_at'] = reg.get('joined_at')
                activity_dict['checked_in_at'] = reg.get('checked_in_at')
                items.append(activity_dict)

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
