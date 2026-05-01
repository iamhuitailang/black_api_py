from typing import Dict, Any, List, Optional
from app.model.yeyou import ActivityModel, RegistrationModel, UserModel


class ActivityBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.user_model = UserModel()

    def create_activity(self, organizer_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('title'):
            return {
                'code': 1,
                'msg': '活动标题不能为空',
                'data': None
            }

        if not data.get('location'):
            return {
                'code': 1,
                'msg': '活动地点不能为空',
                'data': None
            }

        if not data.get('start_time'):
            return {
                'code': 1,
                'msg': '活动时间不能为空',
                'data': None
            }

        data['organizer_id'] = organizer_id
        activity_id = self.activity_model.create(data)

        if activity_id > 0:
            activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '活动创建成功',
                'data': self.activity_model.to_public_dict(activity)
            }

        return {
            'code': 1,
            'msg': '活动创建失败',
            'data': None
        }

    def get_activity_list(self, page: int = 1, page_size: int = 10,
                          activity_type: str = None, status: str = None,
                          difficulty: str = None, keyword: str = None,
                          organizer_id: int = None) -> Dict[str, Any]:
        result = self.activity_model.get_list(
            page, page_size, activity_type, status, difficulty, keyword, organizer_id
        )

        items = []
        for item in result.get('items', []):
            activity_dict = self.activity_model.to_public_dict(item)
            organizer = self.user_model.get_by_id(item.get('organizer_id'))
            if organizer:
                activity_dict['organizer'] = {
                    'id': organizer.get('id'),
                    'nickname': organizer.get('nickname'),
                    'avatar': organizer.get('avatar'),
                    'level': organizer.get('level')
                }
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

    def get_activity_detail(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        activity_dict = self.activity_model.to_public_dict(activity)

        organizer = self.user_model.get_by_id(activity.get('organizer_id'))
        if organizer:
            activity_dict['organizer'] = self.user_model.to_public_dict(organizer)

        registrations_result = self.registration_model.get_by_activity(activity_id, page=1, page_size=100)
        participants = []
        for reg in registrations_result.get('items', []):
            user = self.user_model.get_by_id(reg.get('user_id'))
            if user:
                participants.append({
                    'registration_id': reg.get('id'),
                    'user_id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level'),
                    'status': reg.get('status'),
                    'status_text': self.registration_model.get_status_text(reg.get('status'))
                })
        activity_dict['participants'] = participants

        return {
            'code': 0,
            'msg': 'success',
            'data': activity_dict
        }

    def update_activity(self, activity_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己发起的活动',
                'data': None
            }

        if activity.get('status') not in [ActivityModel.STATUS_RECRUITING, ActivityModel.STATUS_FULL]:
            return {
                'code': 1,
                'msg': '活动已开始或已结束，无法修改',
                'data': None
            }

        affected = self.activity_model.update(activity_id, data)
        if affected >= 0:
            updated_activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.activity_model.to_public_dict(updated_activity)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def cancel_activity(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') != user_id:
            return {
                'code': 1,
                'msg': '只能取消自己发起的活动',
                'data': None
            }

        if activity.get('status') == ActivityModel.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '活动已取消',
                'data': None
            }

        if activity.get('status') == ActivityModel.STATUS_ONGOING:
            return {
                'code': 1,
                'msg': '活动进行中，无法取消',
                'data': None
            }

        affected = self.activity_model.update_status(activity_id, ActivityModel.STATUS_CANCELLED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '活动已取消',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def start_activity(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') != user_id:
            return {
                'code': 1,
                'msg': '只能操作自己发起的活动',
                'data': None
            }

        if activity.get('status') not in [ActivityModel.STATUS_RECRUITING, ActivityModel.STATUS_FULL]:
            return {
                'code': 1,
                'msg': '活动状态不允许开始',
                'data': None
            }

        affected = self.activity_model.update_status(activity_id, ActivityModel.STATUS_ONGOING)
        if affected > 0:
            return {
                'code': 0,
                'msg': '活动已开始',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def finish_activity(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('organizer_id') != user_id:
            return {
                'code': 1,
                'msg': '只能操作自己发起的活动',
                'data': None
            }

        if activity.get('status') != ActivityModel.STATUS_ONGOING:
            return {
                'code': 1,
                'msg': '只有进行中的活动才能结束',
                'data': None
            }

        affected = self.activity_model.update_status(activity_id, ActivityModel.STATUS_FINISHED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '活动已结束',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_my_activities(self, user_id: int, role: str = 'all', page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if role == 'organizer':
            return self.get_activity_list(page, page_size, organizer_id=user_id)
        elif role == 'participant':
            registrations = self.registration_model.get_by_user(user_id, page, page_size)
            items = []
            for reg in registrations.get('items', []):
                activity = self.activity_model.get_by_id(reg.get('activity_id'))
                if activity:
                    activity_dict = self.activity_model.to_public_dict(activity)
                    activity_dict['registration_status'] = reg.get('status')
                    activity_dict['registration_status_text'] = self.registration_model.get_status_text(reg.get('status'))
                    items.append(activity_dict)

            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'items': items,
                    'total': registrations.get('total'),
                    'page': registrations.get('page'),
                    'page_size': registrations.get('page_size'),
                    'total_pages': registrations.get('total_pages')
                }
            }
        else:
            return self.get_activity_list(page, page_size)
