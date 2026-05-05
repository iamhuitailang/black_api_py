from typing import Dict, Any, Optional, List
from app.model.qx import ActivityModel, RegistrationModel, UserModel


class QxActivityBusiness:
    def __init__(self):
        self.activity_model = ActivityModel()
        self.registration_model = RegistrationModel()
        self.user_model = UserModel()

    def create_activity(self, leader_id: int, title: str, route: str = '',
                         distance: float = 0.0, elevation: int = 0, pace: str = '',
                         difficulty: str = ActivityModel.DIFFICULTY_EASY,
                         meeting_time: str = None, meeting_point: str = '',
                         meeting_lng: float = 0.0, meeting_lat: float = 0.0,
                         max_people: int = 10, cost: float = 0.0,
                         description: str = '') -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '活动标题不能为空',
                'data': None
            }

        if distance < 0:
            distance = 0.0

        if max_people < 1:
            max_people = 1

        if difficulty not in ActivityModel.DIFFICULTIES:
            difficulty = ActivityModel.DIFFICULTY_EASY

        activity_id = self.activity_model.create(
            leader_id=leader_id,
            title=title,
            route=route,
            distance=distance,
            elevation=elevation,
            pace=pace,
            difficulty=difficulty,
            meeting_time=meeting_time,
            meeting_point=meeting_point,
            meeting_lng=meeting_lng,
            meeting_lat=meeting_lat,
            max_people=max_people,
            cost=cost,
            description=description
        )

        if activity_id > 0:
            self.registration_model.create(activity_id, leader_id, '')
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

    def get_activity_by_id(self, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        result = self.activity_model.to_dict(activity)
        leader = self.user_model.get_by_id(activity.get('leader_id', 0))
        if leader:
            result['leader'] = {
                'id': leader.get('id'),
                'nickname': leader.get('nickname'),
                'avatar': leader.get('avatar'),
                'level': leader.get('level'),
                'bike_type': leader.get('bike_type')
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_activity_list(self, page: int = 1, page_size: int = 10,
                          status: str = None, difficulty: str = None,
                          keyword: str = None) -> Dict[str, Any]:
        result = self.activity_model.get_list(
            page=page,
            page_size=page_size,
            status=status,
            difficulty=difficulty,
            is_checked=1,
            keyword=keyword
        )

        items = []
        for item in result.get('items', []):
            activity_dict = self.activity_model.to_dict(item)
            leader = self.user_model.get_by_id(item.get('leader_id', 0))
            if leader:
                activity_dict['leader'] = {
                    'id': leader.get('id'),
                    'nickname': leader.get('nickname'),
                    'avatar': leader.get('avatar'),
                    'level': leader.get('level')
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

    def get_my_activities(self, user_id: int, page: int = 1, page_size: int = 10,
                          status: str = None) -> Dict[str, Any]:
        result = self.activity_model.get_by_leader(
            leader_id=user_id,
            page=page,
            page_size=page_size,
            status=status
        )

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

    def update_activity(self, activity_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('leader_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此活动',
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

    def update_activity_status(self, activity_id: int, status: str) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if status not in ActivityModel.STATUSES:
            return {
                'code': 1,
                'msg': '无效的状态',
                'data': None
            }

        affected = self.activity_model.update_status(activity_id, status)
        if affected > 0:
            updated_activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.activity_model.to_dict(updated_activity)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def check_activity(self, activity_id: int, is_checked: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        affected = self.activity_model.update_check_status(activity_id, is_checked)
        if affected > 0:
            updated_activity = self.activity_model.get_by_id(activity_id)
            return {
                'code': 0,
                'msg': '审核成功',
                'data': self.activity_model.to_dict(updated_activity)
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def delete_activity(self, activity_id: int, user_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {
                'code': 1,
                'msg': '活动不存在',
                'data': None
            }

        if activity.get('leader_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此活动',
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

    def get_admin_activity_list(self, page: int = 1, page_size: int = 10,
                                status: str = None, difficulty: str = None,
                                is_checked: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.activity_model.get_list(
            page=page,
            page_size=page_size,
            status=status,
            difficulty=difficulty,
            is_checked=is_checked,
            keyword=keyword
        )

        items = []
        for item in result.get('items', []):
            activity_dict = self.activity_model.to_dict(item)
            leader = self.user_model.get_by_id(item.get('leader_id', 0))
            if leader:
                activity_dict['leader'] = {
                    'id': leader.get('id'),
                    'nickname': leader.get('nickname'),
                    'phone': leader.get('phone')
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
