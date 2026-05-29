from typing import Dict, Any, Optional
from app.model.huodong import ActivityModel, CategoryModel, HuodongUserModel
from app.model.huodong.photo import PhotoModel
from app.model.huodong.registration import RegistrationModel
from app.model.huodong.points import PointsModel
from app.model.huodong.message import MessageModel


class ActivityBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.category_model = CategoryModel()
        self.user_model = HuodongUserModel()
        self.photo_model = PhotoModel()
        self.registration_model = RegistrationModel()
        self.points_model = PointsModel()
        self.message_model = MessageModel()

    def _validate_category(self, category: str) -> bool:
        cat = self.category_model.get_by_code(category)
        return cat is not None

    def create_activity(self, user_id: int, **kwargs) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        if user.get('status') in [HuodongUserModel.STATUS_BANNED, HuodongUserModel.STATUS_MUTED]:
            return {'code': 1, 'msg': '账号状态异常，无法发布', 'data': None}
        title = kwargs.get('title', '')
        if not title or len(title.strip()) < 2:
            return {'code': 1, 'msg': '标题至少2个字符', 'data': None}
        category = kwargs.get('category', '')
        if not self._validate_category(category):
            return {'code': 1, 'msg': '分类参数不正确', 'data': None}
        
        start_time = kwargs.get('start_time')
        end_time = kwargs.get('end_time')
        if start_time and end_time and end_time <= start_time:
            return {'code': 1, 'msg': '结束时间必须大于开始时间', 'data': None}
        
        kwargs['title'] = title.strip()
        activity_id = self.activity_model.create(user_id=user_id, **kwargs)
        if activity_id > 0:
            self.points_model.add(user_id, 5, PointsModel.TYPE_PUBLISH, activity_id, '发布活动+5积分')
            self.user_model.update_points(user_id, 5)
            activity = self.activity_model.get_by_id(activity_id)
            return {'code': 0, 'msg': '发布成功', 'data': self.activity_model.to_dict(activity)}
        return {'code': 1, 'msg': '发布失败', 'data': None}

    def get_activity_detail(self, activity_id: int, viewer_user_id: int = None) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if activity.get('is_checked') == 0:
            return {'code': 1, 'msg': '活动正在审核中', 'data': None}
        self.activity_model.increment_view_count(activity_id)
        activity_data = self.activity_model.to_dict(activity)
        user = self.user_model.get_by_id(activity.get('user_id'))
        if user:
            activity_data['publisher'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'points': user.get('points')
            }
        photos = self.photo_model.get_by_activity(activity_id)
        activity_data['photos'] = [self.photo_model.to_dict(p) for p in photos]
        reg_count = self.registration_model.count_by_activity(activity_id)
        activity_data['registration_count'] = reg_count
        if viewer_user_id:
            from app.model.huodong.favorite import FavoriteModel
            fav_model = FavoriteModel()
            activity_data['is_favorited'] = fav_model.is_favorited(viewer_user_id, activity_id)
            reg = self.registration_model.get_by_activity_and_user(activity_id, viewer_user_id)
            activity_data['is_registered'] = reg is not None and reg.get('status') in [
                RegistrationModel.STATUS_PENDING, RegistrationModel.STATUS_APPROVED
            ]
        else:
            activity_data['is_favorited'] = False
            activity_data['is_registered'] = False
        return {'code': 0, 'msg': 'success', 'data': activity_data}

    def get_activity_list(self, page: int = 1, page_size: int = 10,
                          category: str = None, status: int = None, keyword: str = None,
                          city: str = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        result = self.activity_model.get_list(
            page=page, page_size=page_size, category=category,
            status=status, is_checked=1, keyword=keyword,
            city=city, order_by=order_by
        )
        items = []
        for activity in result.get('items', []):
            activity_data = self.activity_model.to_dict(activity)
            user = self.user_model.get_by_id(activity.get('user_id'))
            if user:
                activity_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            items.append(activity_data)
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

    def get_featured_activities(self, limit: int = 5) -> Dict[str, Any]:
        activities = self.activity_model.get_featured(limit)
        items = []
        for a in activities:
            activity_data = self.activity_model.to_dict(a)
            user = self.user_model.get_by_id(a.get('user_id'))
            if user:
                activity_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            items.append(activity_data)
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_nearby_activities(self, latitude: float, longitude: float,
                              radius_km: float = 10, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.activity_model.get_nearby(latitude, longitude, radius_km, page, page_size)
        items = []
        for activity in result.get('items', []):
            activity_data = self.activity_model.to_dict(activity)
            user = self.user_model.get_by_id(activity.get('user_id'))
            if user:
                activity_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            items.append(activity_data)
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

    def get_my_activities(self, user_id: int, page: int = 1, page_size: int = 10,
                          status: int = None) -> Dict[str, Any]:
        result = self.activity_model.get_by_user(user_id, page, page_size, status)
        items = [self.activity_model.to_dict(a) for a in result.get('items', [])]
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

    def update_activity(self, user_id: int, activity_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if activity.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能修改自己发布的活动', 'data': None}
        if activity.get('status') in [ActivityModel.STATUS_COMPLETED, ActivityModel.STATUS_CANCELLED]:
            return {'code': 1, 'msg': '该状态下无法修改', 'data': None}
        
        start_time = data.get('start_time') if 'start_time' in data else activity.get('start_time')
        end_time = data.get('end_time') if 'end_time' in data else activity.get('end_time')
        if start_time and end_time and end_time <= start_time:
            return {'code': 1, 'msg': '结束时间必须大于开始时间', 'data': None}
        
        affected = self.activity_model.update(activity_id, data)
        if affected >= 0:
            updated = self.activity_model.get_by_id(activity_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.activity_model.to_dict(updated)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_activity(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if activity.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能删除自己发布的活动', 'data': None}
        affected = self.activity_model.update_status(activity_id, ActivityModel.STATUS_CANCELLED)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_categories(self) -> Dict[str, Any]:
        categories = self.category_model.get_all_categories()
        return {'code': 0, 'msg': 'success', 'data': categories}

    def get_admin_activity_list(self, page: int = 1, page_size: int = 10,
                                category: str = None, status: int = None,
                                is_checked: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.activity_model.get_list(
            page=page, page_size=page_size, category=category,
            status=status, is_checked=is_checked, keyword=keyword
        )
        items = []
        for activity in result.get('items', []):
            activity_data = self.activity_model.to_dict(activity)
            user = self.user_model.get_by_id(activity.get('user_id'))
            if user:
                activity_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'phone': user.get('phone')
                }
            items.append(activity_data)
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

    def check_activity(self, activity_id: int, is_checked: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        affected = self.activity_model.update_check_status(activity_id, is_checked)
        if affected > 0:
            if is_checked == 1:
                self.message_model.create(
                    user_id=activity.get('user_id'),
                    title='活动审核通过',
                    content=f'您发布的活动「{activity.get("title")}」已通过审核',
                    message_type=MessageModel.TYPE_SYSTEM,
                    reference_id=activity_id
                )
            else:
                self.message_model.create(
                    user_id=activity.get('user_id'),
                    title='活动审核未通过',
                    content=f'您发布的活动「{activity.get("title")}」未通过审核，请修改后重新提交',
                    message_type=MessageModel.TYPE_SYSTEM,
                    reference_id=activity_id
                )
            return {'code': 0, 'msg': '审核成功', 'data': None}
        return {'code': 1, 'msg': '审核失败', 'data': None}
