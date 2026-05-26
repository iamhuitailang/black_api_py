from typing import Dict, Any, Optional
from app.model.movie import MovieModel, ReviewModel


class MovieBusiness:
    def __init__(self):
        self.movie_model = MovieModel()
        self.review_model = ReviewModel()

    def _enrich_movie(self, movie: Dict[str, Any]) -> Dict[str, Any]:
        movie_id = movie.get('id')
        avg_rating = self.review_model.get_average_rating(movie_id)
        review_count = self.review_model.count_reviews(movie_id)
        movie['avg_rating'] = avg_rating
        movie['review_count'] = review_count
        movie['status_text'] = self.movie_model.get_status_text(movie.get('status', 0))
        return movie

    def create_movie(self, title: str, poster: str = '', description: str = '',
                     duration: int = 0, genre: str = '', director: str = '',
                     actors: str = '', language: str = '', rating: float = 0,
                     trailer_url: str = '', status: int = 0,
                     release_date: str = '') -> Dict[str, Any]:
        if not title:
            return {'code': 1, 'msg': '影片标题不能为空', 'data': None}

        movie_id = self.movie_model.create(
            title=title, poster=poster, description=description,
            duration=duration, genre=genre, director=director,
            actors=actors, language=language, rating=rating,
            trailer_url=trailer_url, status=status, release_date=release_date
        )
        if movie_id > 0:
            movie = self.movie_model.get_by_id(movie_id)
            return {'code': 0, 'msg': '创建成功', 'data': self._enrich_movie(movie)}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_movie(self, movie_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        affected = self.movie_model.update(movie_id, data)
        if affected >= 0:
            updated_movie = self.movie_model.get_by_id(movie_id)
            return {'code': 0, 'msg': '更新成功', 'data': self._enrich_movie(updated_movie)}

        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_movie(self, movie_id: int) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        affected = self.movie_model.delete(movie_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_movie_detail(self, movie_id: int) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        return {'code': 0, 'msg': 'success', 'data': self._enrich_movie(movie)}

    def get_movie_list(self, page: int = 1, page_size: int = 10,
                       status: int = None, keyword: str = None,
                       genre: str = None) -> Dict[str, Any]:
        result = self.movie_model.get_all(page, page_size, status, keyword, genre)
        items = [self._enrich_movie(item) for item in result.get('items', [])]

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

    def update_movie_status(self, movie_id: int, status: int) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        affected = self.movie_model.update_status(movie_id, status)
        if affected > 0:
            return {'code': 0, 'msg': '状态更新成功', 'data': None}

        return {'code': 1, 'msg': '状态更新失败', 'data': None}