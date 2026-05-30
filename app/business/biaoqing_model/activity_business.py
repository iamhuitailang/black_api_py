from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import ActivityModel, RegistrationModel, PointLogModel


class BqActivityBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.point_log_model = PointLogModel()

    def create(self, title: str, description: str = '', cover_image: str = '',
                 content: str = '', start_time: str = '', end_time: str = '',
                 points_reward: int = 0, max_participants: int = 0,
                 created_by: int = 0) -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '活动标题不能为空',
                'data': None
            }

        activity_id = self.activity_model.create(
            title=title, description=description,
            cover_image=cover_image, content=content,
            start_time=start_time, end_time=end_time,
            points_reward=points_reward,
            max_participants=max_participants,
            created_by=created_by
        )

        if activity_id > 0:
            activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.activity_model.to_dict(activity)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, activity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        affected = self.activity_model.update(activity_id, data)
        if affected >= 0:
            updated = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.activity_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        affected = self.activity_model.delete(activity_id)
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

    def get_by_id(self, activity_id: int, user_id: int = 0) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        result = self.activity_model.to_dict(activity)
        if user_id > 0:
            result['is_registered'] = self.registration_model.is_registered(activity_id, user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_active_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.activity_model.get_active_list(page, page_size)
        items = [self.activity_model.to_dict(item) for item in result.get('items', [])]

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

    def get_list(self, page: int = 1, page_size: int = 20, status: int = None, user_id: int = 0) -> Dict[str, Any]:
        result = self.activity_model.get_all(page, page_size, status)
        items = []
        for item in result.get('items', []):
            item_dict = self.activity_model.to_dict(item)
            if user_id > 0:
                item_dict['is_registered'] = self.registration_model.is_registered(item.get('id'), user_id)
            items.append(item_dict)

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

    def register(self, activity_id: int, user_id: int, name: str = '',
                 phone: str = '', email: str = '', extra_info: str = '') -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('status') != ActivityModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '活动未开始或已结束',
                'data': None
            }

        max_participants = activity.get('max_participants', 0)
        current_participants = activity.get('current_participants', 0)
        if max_participants > 0 and current_participants >= max_participants:
            return {
                'code': 1,
                'msg': '活动名额已满',
                'data': None
            }

        if self.registration_model.is_registered(activity_id, user_id):
            return {
                'code': 1,
                'msg': '已报名该活动',
                'data': None
            }

        registration_id = self.registration_model.create(
            activity_id=activity_id, user_id=user_id,
            name=name, phone=phone, email=email,
            extra_info=extra_info
        )

        if registration_id > 0:
            points_reward = activity.get('points_reward', 0)
            if points_reward > 0:
                self.point_log_model.create(
                    user_id, points_reward,
                    PointLogModel.TYPE_ACTIVITY,
                    f'参与活动：{activity.get("title")}'
                )

            registration = self.registration_model.get_by_id(registration_id)
            return {
                'code': 0,
                'msg': '报名成功',
                'data': self.registration_model.to_dict(registration)
            }

        return {
            'code': 1,
            'msg': '报名失败',
            'data': None
        }

    def cancel_registration(self, registration_id: int, user_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        if registration.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        affected = self.registration_model.cancel(registration_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def get_registrations(self, activity_id: int, page: int = 1, page_size: int = 20,
                          status: int = None) -> Dict[str, Any]:
        result = self.registration_model.get_by_activity_id(activity_id, page, page_size, status)
        items = [self.registration_model.to_dict(item) for item in result.get('items', [])]

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

    def get_user_registrations(self, user_id: int, page: int = 1, page_size: int = 20,
                                status: int = None) -> Dict[str, Any]:
        result = self.registration_model.get_by_user_id(user_id, page, page_size, status)

        items = []
        for item in result.get('items', []):
            reg_dict = self.registration_model.to_dict(item)
            activity = self.activity_model.get_by_id(item.get('activity_id'))
            if activity:
                reg_dict['activity'] = self.activity_model.to_dict(activity)
            items.append(reg_dict)

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

    def update_registration_status(self, registration_id: int, status: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        affected = self.registration_model.update_status(registration_id, status)
        if affected > 0:
            updated = self.registration_model.get_by_id(registration_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.registration_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def increment_view_count(self, activity_id: int) -> Dict[str, Any]:
        affected = self.activity_model.increment_view_count(activity_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }
