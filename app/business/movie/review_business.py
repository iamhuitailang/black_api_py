from typing import Dict, Any, Optional
from app.model.movie import ReviewModel, MovieModel, UserModel


class ReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()
        self.movie_model = MovieModel()
        self.user_model = UserModel()

    def _enrich_review(self, review: Dict[str, Any]) -> Dict[str, Any]:
        user_id = review.get('user_id')
        if user_id:
            user = self.user_model.get_by_id(user_id)
            if user:
                review['user'] = {
                    'username': user.get('username', ''),
                    'nickname': user.get('nickname', ''),
                    'avatar': user.get('avatar', '')
                }

        movie_id = review.get('movie_id')
        if movie_id:
            movie = self.movie_model.get_by_id(movie_id)
            if movie:
                review['movie'] = {
                    'title': movie.get('title', ''),
                    'poster': movie.get('poster', '')
                }

        return review

    def create_review(self, user_id: int, movie_id: int,
                      rating: float, content: str = '') -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        if rating < 0 or rating > 10:
            return {'code': 1, 'msg': '评分必须在0-10之间', 'data': None}

        existing = self.review_model.get_user_review_for_movie(user_id, movie_id)
        if existing:
            return {'code': 1, 'msg': '您已评价过该影片', 'data': None}

        review_id = self.review_model.create(
            user_id=user_id,
            movie_id=movie_id,
            rating=rating,
            content=content
        )
        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {'code': 0, 'msg': '评价成功', 'data': self._enrich_review(review)}

        return {'code': 1, 'msg': '评价失败', 'data': None}

    def update_review(self, review_id: int, user_id: int,
                      data: Dict[str, Any]) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {'code': 1, 'msg': '评价不存在', 'data': None}

        if review.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权修改此评价', 'data': None}

        affected = self.review_model.update(review_id, data)
        if affected >= 0:
            updated = self.review_model.get_by_id(review_id)
            return {'code': 0, 'msg': '更新成功', 'data': self._enrich_review(updated)}

        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_review(self, review_id: int, user_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {'code': 1, 'msg': '评价不存在', 'data': None}

        if review.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权删除此评价', 'data': None}

        affected = self.review_model.delete(review_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_reviews_by_movie(self, movie_id: int, page: int = 1,
                             page_size: int = 10) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        result = self.review_model.get_by_movie_id(movie_id, page, page_size)
        items = [self._enrich_review(item) for item in result.get('items', [])]

        avg_rating = self.review_model.get_average_rating(movie_id)
        review_count = self.review_model.count_reviews(movie_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'avg_rating': avg_rating,
                'review_count': review_count
            }
        }

    def get_my_reviews(self, user_id: int, page: int = 1,
                       page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_user_id(user_id, page, page_size)
        items = [self._enrich_review(item) for item in result.get('items', [])]

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

    def get_user_review_for_movie(self, user_id: int,
                                  movie_id: int) -> Dict[str, Any]:
        review = self.review_model.get_user_review_for_movie(user_id, movie_id)
        if review:
            return {'code': 0, 'msg': 'success', 'data': self._enrich_review(review)}

        return {'code': 0, 'msg': 'success', 'data': None}