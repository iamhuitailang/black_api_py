from typing import Dict, Any
from app.model.huodong import FavoriteModel, ActivityModel, HuodongUserModel


class FavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.activity_model = ActivityModel()
        self.user_model = HuodongUserModel()

    def add_favorite(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if self.favorite_model.is_favorited(user_id, activity_id):
            return {'code': 1, 'msg': '已收藏该活动', 'data': None}
        fav_id = self.favorite_model.add(user_id, activity_id)
        if fav_id > 0:
            return {'code': 0, 'msg': '收藏成功', 'data': None}
        return {'code': 1, 'msg': '收藏失败', 'data': None}

    def remove_favorite(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        if not self.favorite_model.is_favorited(user_id, activity_id):
            return {'code': 1, 'msg': '未收藏该活动', 'data': None}
        affected = self.favorite_model.remove(user_id, activity_id)
        if affected > 0:
            return {'code': 0, 'msg': '取消收藏成功', 'data': None}
        return {'code': 1, 'msg': '取消收藏失败', 'data': None}

    def toggle_favorite(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        if self.favorite_model.is_favorited(user_id, activity_id):
            return self.remove_favorite(user_id, activity_id)
        return self.add_favorite(user_id, activity_id)

    def is_favorited(self, user_id: int, activity_id: int) -> Dict[str, Any]:
        is_fav = self.favorite_model.is_favorited(user_id, activity_id)
        return {'code': 0, 'msg': 'success', 'data': {'is_favorited': is_fav}}

    def get_my_favorites(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.favorite_model.get_by_user(user_id, page, page_size)
        items = []
        for fav in result.get('items', []):
            activity = self.activity_model.get_by_id(fav.get('activity_id'))
            if activity:
                activity_data = self.activity_model.to_dict(activity)
                user = self.user_model.get_by_id(activity.get('user_id'))
                if user:
                    activity_data['publisher'] = {
                        'id': user.get('id'),
                        'nickname': user.get('nickname'),
                        'avatar': user.get('avatar')
                    }
                activity_data['favorited_at'] = fav.get('created_at')
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
