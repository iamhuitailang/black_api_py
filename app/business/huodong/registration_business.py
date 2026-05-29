from typing import Dict, Any
from app.model.huodong import ActivityModel, RegistrationModel, HuodongUserModel
from app.model.huodong.points import PointsModel
from app.model.huodong.message import MessageModel


class RegistrationBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.user_model = HuodongUserModel()
        self.points_model = PointsModel()
        self.message_model = MessageModel()

    def register(self, user_id: int, activity_id: int, remark: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if activity.get('status') != ActivityModel.STATUS_PENDING:
            return {'code': 1, 'msg': '该活动当前不可报名', 'data': None}
        if activity.get('is_checked') == 0:
            return {'code': 1, 'msg': '活动正在审核中', 'data': None}
        existing = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if existing:
            return {'code': 1, 'msg': '您已报名该活动', 'data': None}
        max_p = activity.get('max_participants', 0)
        current_p = activity.get('current_participants', 0)
        if max_p > 0 and current_p >= max_p:
            return {'code': 1, 'msg': '活动人数已满', 'data': None}
        reg_id = self.registration_model.create(activity_id, user_id, remark)
        if reg_id > 0:
            self.activity_model.increment_participants(activity_id)
            self.points_model.add(user_id, 2, PointsModel.TYPE_SIGNUP, activity_id, '报名活动+2积分')
            self.user_model.update_points(user_id, 2)
            self.message_model.create(
                user_id=activity.get('user_id'),
                title='新用户报名',
                content=f'有用户报名了您发布的活动「{activity.get("title")}」',
                message_type=MessageModel.TYPE_ACTIVITY,
                reference_id=activity_id
            )
            reg = self.registration_model.get_by_id(reg_id)
            return {'code': 0, 'msg': '报名成功', 'data': self.registration_model.to_dict(reg)}
        return {'code': 1, 'msg': '报名失败', 'data': None}

    def cancel_registration(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        reg = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not reg:
            return {'code': 1, 'msg': '未找到报名记录', 'data': None}
        if reg.get('status') == RegistrationModel.STATUS_CANCELLED:
            return {'code': 1, 'msg': '已取消报名', 'data': None}
        affected = self.registration_model.cancel(reg.get('id'))
        if affected > 0:
            self.activity_model.decrement_participants(activity_id)
            return {'code': 0, 'msg': '取消报名成功', 'data': None}
        return {'code': 1, 'msg': '取消报名失败', 'data': None}

    def get_registrations_by_activity(self, activity_id: int, page: int = 1,
                                       page_size: int = 20) -> Dict[str, Any]:
        result = self.registration_model.get_by_activity(activity_id, page, page_size)
        items = []
        for reg in result.get('items', []):
            reg_data = self.registration_model.to_dict(reg)
            user = self.user_model.get_by_id(reg.get('user_id'))
            if user:
                reg_data['user'] = self.user_model.to_public_dict(user)
            items.append(reg_data)
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

    def get_my_registrations(self, user_id: int, page: int = 1, page_size: int = 10,
                              status: int = None) -> Dict[str, Any]:
        result = self.registration_model.get_by_user(user_id, page, page_size, status)
        items = []
        for reg in result.get('items', []):
            reg_data = self.registration_model.to_dict(reg)
            activity = self.activity_model.get_by_id(reg.get('activity_id'))
            if activity:
                reg_data['activity'] = self.activity_model.to_dict(activity)
            items.append(reg_data)
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
