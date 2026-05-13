from typing import Dict, Any, List, Optional
from app.model.bm import ActivityModel, RegistrationModel, ActivityTagModel


class BmActivityBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.activity_tag_model = ActivityTagModel()

    def create_activity(self, title: str, description: str, cover_image: str,
                        location: str, start_time: str, end_time: str,
                        registration_start: str, registration_end: str,
                        total_quota: int, need_approval: int = 0,
                        created_by: int = None, tag_ids: List[int] = None) -> Dict[str, Any]:
        if not title or not location or not start_time or not end_time:
            return {
                'code': 1,
                'msg': '活动标题、地点、时间不能为空',
                'data': None
            }

        if total_quota <= 0:
            return {
                'code': 1,
                'msg': '活动名额必须大于0',
                'data': None
            }

        activity_id = self.activity_model.create(
            title=title,
            description=description,
            cover_image=cover_image,
            location=location,
            start_time=start_time,
            end_time=end_time,
            registration_start=registration_start,
            registration_end=registration_end,
            total_quota=total_quota,
            need_approval=need_approval,
            created_by=created_by
        )

        if activity_id > 0 and tag_ids:
            for tag_id in tag_ids:
                self.activity_tag_model.create(activity_id, tag_id)

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

    def update_activity(self, activity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        affected = self.activity_model.update(activity_id, data)
        if affected >= 0:
            updated_activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.activity_model.to_dict(updated_activity)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_activity(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        self.activity_tag_model.delete_by_activity(activity_id)
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

    def get_activity_detail(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        tags = self.activity_tag_model.get_by_activity(activity_id)

        result = self.activity_model.to_dict(activity)
        result['tags'] = tags

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_activity_list(self, page: int = 1, page_size: int = 10,
                          status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.activity_model.get_all(page, page_size, status, keyword)
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

    def register_activity(self, activity_id: int, real_name: str, phone: str,
                          email: str = '', remark: str = '', user_id: int = None) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('remaining_quota', 0) <= 0:
            return {
                'code': 1,
                'msg': '活动名额已满',
                'data': None
            }

        if activity.get('status') != self.activity_model.STATUS_REGISTERING:
            return {
                'code': 1,
                'msg': '活动不在报名中',
                'data': None
            }

        if user_id:
            existing_reg = self.registration_model.get_by_user_and_activity(user_id, activity_id)
            if existing_reg:
                return {
                    'code': 1,
                    'msg': '您已报名该活动',
                    'data': None
                }

        current_version = activity.get('version', 0)
        success = self.activity_model.decrease_quota_with_version(activity_id, current_version)

        if not success:
            return {
                'code': 1,
                'msg': '报名失败，请重试',
                'data': None
            }

        need_approval = activity.get('need_approval', 0) == 1
        result = self.registration_model.create(
            activity_id=activity_id,
            real_name=real_name,
            phone=phone,
            email=email,
            remark=remark,
            user_id=user_id,
            need_approval=need_approval
        )

        if result:
            return {
                'code': 0,
                'msg': '报名成功' if not need_approval else '报名提交成功，等待审核',
                'data': result
            }

        self.activity_model.increase_quota(activity_id)
        return {
            'code': 1,
            'msg': '报名失败',
            'data': None
        }

    def cancel_registration(self, registration_id: int) -> Dict[str, Any]:
        registration = self.registration_model.get_by_id(registration_id)
        if not registration:
            return {
                'code': 1,
                'msg': '报名记录不存在',
                'data': None
            }

        if registration.get('status') == self.registration_model.STATUS_CANCELLED:
            return {
                'code': 1,
                'msg': '报名已取消',
                'data': None
            }

        affected = self.registration_model.update_status(
            registration_id,
            self.registration_model.STATUS_CANCELLED
        )

        if affected > 0:
            self.activity_model.increase_quota(registration.get('activity_id'))
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

    def get_user_registrations(self, user_id: int, page: int = 1,
                                page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.registration_model.get_by_user(user_id, page, page_size, status)
        items = [self.registration_model.to_dict(item) for item in result.get('items', [])]

        for item in items:
            activity = self.activity_model.get_by_id(item['activity_id'])
            if activity:
                item['activity'] = self.activity_model.to_dict(activity)

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
