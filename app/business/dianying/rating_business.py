from typing import Dict, Any
from app.model.dianying.rating import DianyingRatingModel
from app.model.dianying.movie import DianyingMovieModel


class DianyingRatingBusiness:
    def __init__(self):
        self.model = DianyingRatingModel()
        self.movie_model = DianyingMovieModel()

    def rate_movie(self, user_id: int, movie_id: int, score: float) -> Dict[str, Any]:
        if score < 1 or score > 10:
            return {'code': 1, 'message': '评分必须在1-10之间', 'data': None}
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'message': '电影不存在', 'data': None}
        try:
            rating_id = self.model.upsert(user_id, movie_id, score)
            self.movie_model.update_rating(movie_id)
            rating = self.model.get_by_id(rating_id)
            return {'code': 0, 'message': '评分成功', 'data': rating}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_user_movie_rating(self, user_id: int, movie_id: int) -> Dict[str, Any]:
        rating = self.model.get_user_movie_rating(user_id, movie_id)
        return {'code': 0, 'message': 'success', 'data': rating}

    def get_user_ratings(self, user_id: int) -> Dict[str, Any]:
        ratings = self.model.get_all_by_user(user_id)
        return {'code': 0, 'message': 'success', 'data': ratings}

    def get_movie_ratings(self, movie_id: int) -> Dict[str, Any]:
        ratings = self.model.get_all_by_movie(movie_id)
        return {'code': 0, 'message': 'success', 'data': ratings}

    def delete_rating(self, rating_id: int, user_id: int) -> Dict[str, Any]:
        rating = self.model.get_by_id(rating_id)
        if not rating:
            return {'code': 1, 'message': '评分不存在', 'data': None}
        if rating['user_id'] != user_id:
            return {'code': 1, 'message': '无权限删除', 'data': None}
        movie_id = rating['movie_id']
        self.model.delete(rating_id)
        self.movie_model.update_rating(movie_id)
        return {'code': 0, 'message': '删除成功', 'data': None}
