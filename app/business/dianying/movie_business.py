from typing import Dict, Any, List
from app.model.dianying.movie import DianyingMovieModel


class DianyingMovieBusiness:
    def __init__(self):
        self.model = DianyingMovieModel()

    def list_movies(self, genre: str = None, year: int = None, min_rating: float = None,
                    search: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        items, total = self.model.get_all(genre=genre, year=year, min_rating=min_rating,
                                           search=search, limit=page_size, offset=offset)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': items,
                'total': total,
                'page': page,
                'page_size': page_size
            }
        }

    def get_movie(self, movie_id: int) -> Dict[str, Any]:
        movie = self.model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'message': '电影不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': movie}

    def create_movie(self, **kwargs) -> Dict[str, Any]:
        try:
            movie_id = self.model.create(**kwargs)
            movie = self.model.get_by_id(movie_id)
            return {'code': 0, 'message': '创建成功', 'data': movie}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def update_movie(self, movie_id: int, **kwargs) -> Dict[str, Any]:
        existing = self.model.get_by_id(movie_id)
        if not existing:
            return {'code': 1, 'message': '电影不存在', 'data': None}
        self.model.update(movie_id, **kwargs)
        movie = self.model.get_by_id(movie_id)
        return {'code': 0, 'message': '更新成功', 'data': movie}

    def delete_movie(self, movie_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(movie_id)
        if not existing:
            return {'code': 1, 'message': '电影不存在', 'data': None}
        self.model.delete(movie_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def get_genres(self) -> Dict[str, Any]:
        genres = self.model.get_all_genres()
        return {'code': 0, 'message': 'success', 'data': genres}

    def get_years(self) -> Dict[str, Any]:
        years = self.model.get_all_years()
        return {'code': 0, 'message': 'success', 'data': years}

    def get_recommended(self, user_id: int, limit: int = 10) -> Dict[str, Any]:
        movies = self.model.get_recommended(user_id, limit)
        return {'code': 0, 'message': 'success', 'data': movies}
