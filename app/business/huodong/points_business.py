from typing import Dict, Any
from app.model.huodong import PointsModel, HuodongUserModel


class PointsBusiness:
    def __init__(self):
        self.points_model = PointsModel()
        self.user_model = HuodongUserModel()

    def get_my_points(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.points_model.get_by_user(user_id, page, page_size)
        items = [self.points_model.to_dict(p) for p in result.get('items', [])]
        total_points = self.points_model.get_total_by_user(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_points': total_points,
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_points_summary(self, user_id: int) -> Dict[str, Any]:
        total = self.points_model.get_total_by_user(user_id)
        user = self.user_model.get_by_id(user_id)
        current_points = user.get('points', 0) if user else 0
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'current_points': current_points,
                'total_earned': total
            }
        }
