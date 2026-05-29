from typing import Dict, Any
from app.model.huodong import CheckinModel, ActivityModel, HuodongUserModel
from app.model.huodong.points import PointsModel
from app.model.huodong.registration import RegistrationModel


class CheckinBusiness:
    def __init__(self):
        self.checkin_model = CheckinModel()
        self.activity_model = ActivityModel()
        self.user_model = HuodongUserModel()
        self.points_model = PointsModel()
        self.registration_model = RegistrationModel()

    def checkin(self, user_id: int, activity_id: int, location_text: str = '',
                remark: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        existing = self.checkin_model.get_by_activity_and_user(activity_id, user_id)
        if existing:
            return {'code': 1, 'msg': '您已签到该活动', 'data': None}
        reg = self.registration_model.get_by_activity_and_user(activity_id, user_id)
        if not reg or reg.get('status') not in [RegistrationModel.STATUS_APPROVED, RegistrationModel.STATUS_PENDING]:
            return {'code': 1, 'msg': '您未报名该活动，无法签到', 'data': None}
        checkin_id = self.checkin_model.create(activity_id, user_id, location_text, remark)
        if checkin_id > 0:
            self.points_model.add(user_id, 3, PointsModel.TYPE_CHECKIN, activity_id, '活动签到+3积分')
            self.user_model.update_points(user_id, 3)
            checkin = self.checkin_model.get_by_activity_and_user(activity_id, user_id)
            return {'code': 0, 'msg': '签到成功', 'data': self.checkin_model.to_dict(checkin)}
        return {'code': 1, 'msg': '签到失败', 'data': None}

    def get_checkins_by_activity(self, activity_id: int, page: int = 1,
                                  page_size: int = 20) -> Dict[str, Any]:
        result = self.checkin_model.get_by_activity(activity_id, page, page_size)
        items = []
        for checkin in result.get('items', []):
            checkin_data = self.checkin_model.to_dict(checkin)
            user = self.user_model.get_by_id(checkin.get('user_id'))
            if user:
                checkin_data['user'] = self.user_model.to_public_dict(user)
            items.append(checkin_data)
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

    def get_my_checkins(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.checkin_model.get_by_user(user_id, page, page_size)
        items = []
        for checkin in result.get('items', []):
            checkin_data = self.checkin_model.to_dict(checkin)
            activity = self.activity_model.get_by_id(checkin.get('activity_id'))
            if activity:
                checkin_data['activity'] = self.activity_model.to_dict(activity)
            items.append(checkin_data)
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
