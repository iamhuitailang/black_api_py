from typing import Dict, Any
from app.model.dianying.favorite import DianyingFavoriteModel


class DianyingFavoriteBusiness:
    def __init__(self):
        self.model = DianyingFavoriteModel()

    def add_favorite(self, user_id: int, movie_id: int) -> Dict[str, Any]:
        self.model.add(user_id, movie_id)
        return {'code': 0, 'message': '收藏成功', 'data': None}

    def remove_favorite(self, user_id: int, movie_id: int) -> Dict[str, Any]:
        self.model.remove(user_id, movie_id)
        return {'code': 0, 'message': '取消收藏成功', 'data': None}

    def check_favorite(self, user_id: int, movie_id: int) -> Dict[str, Any]:
        is_fav = self.model.is_favorite(user_id, movie_id)
        return {'code': 0, 'message': 'success', 'data': {'is_favorite': is_fav}}

    def get_user_favorites(self, user_id: int) -> Dict[str, Any]:
        movies = self.model.get_user_favorites(user_id)
        return {'code': 0, 'message': 'success', 'data': movies}

    def get_user_favorite_ids(self, user_id: int) -> Dict[str, Any]:
        ids = self.model.get_user_favorite_ids(user_id)
        return {'code': 0, 'message': 'success', 'data': ids}

    def toggle_favorite(self, user_id: int, movie_id: int) -> Dict[str, Any]:
        if self.model.is_favorite(user_id, movie_id):
            self.model.remove(user_id, movie_id)
            return {'code': 0, 'message': '取消收藏成功', 'data': {'is_favorite': False}}
        else:
            self.model.add(user_id, movie_id)
            return {'code': 0, 'message': '收藏成功', 'data': {'is_favorite': True}}
