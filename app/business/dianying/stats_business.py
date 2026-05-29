from typing import Dict, Any
from app.common.sqlite.db import get_db
from app.model.dianying.movie import DianyingMovieModel
from app.model.dianying.user import DianyingUserModel
from app.model.dianying.rating import DianyingRatingModel
from app.model.dianying.favorite import DianyingFavoriteModel


class DianyingStatsBusiness:
    def get_dashboard(self) -> Dict[str, Any]:
        db = get_db()
        movie_count = db.fetch_one(f"SELECT COUNT(*) as total FROM {DianyingMovieModel.TABLE_NAME}")['total']
        user_count = db.fetch_one(f"SELECT COUNT(*) as total FROM {DianyingUserModel.TABLE_NAME}")['total']
        rating_count = db.fetch_one(f"SELECT COUNT(*) as total FROM {DianyingRatingModel.TABLE_NAME}")['total']
        fav_count = db.fetch_one(f"SELECT COUNT(*) as total FROM {DianyingFavoriteModel.TABLE_NAME}")['total']
        avg = db.fetch_one(f"SELECT AVG(rating) as avg FROM {DianyingMovieModel.TABLE_NAME}")
        avg_rating = round(avg['avg'], 2) if avg and avg['avg'] else 0
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_movies': movie_count,
                'total_users': user_count,
                'total_ratings': rating_count,
                'total_favorites': fav_count,
                'avg_rating': avg_rating
            }
        }

    def get_rating_distribution(self) -> Dict[str, Any]:
        db = get_db()
        distribution = []
        for i in range(1, 11):
            row = db.fetch_one(
                f"SELECT COUNT(*) as cnt FROM {DianyingRatingModel.TABLE_NAME} WHERE score >= ? AND score < ?",
                (i, i + 1)
            )
            if i == 10:
                row = db.fetch_one(
                    f"SELECT COUNT(*) as cnt FROM {DianyingRatingModel.TABLE_NAME} WHERE score >= ?",
                    (10,)
                )
            distribution.append({'score': i, 'count': row['cnt'] if row else 0})
        return {'code': 0, 'message': 'success', 'data': distribution}

    def get_top_movies(self, limit: int = 10) -> Dict[str, Any]:
        db = get_db()
        movies = db.fetch_all(
            f"SELECT id, title, poster, rating, rating_count, year, genre FROM {DianyingMovieModel.TABLE_NAME} ORDER BY rating DESC, rating_count DESC LIMIT ?",
            (limit,)
        )
        return {'code': 0, 'message': 'success', 'data': movies}

    def get_genre_distribution(self) -> Dict[str, Any]:
        movie_model = DianyingMovieModel()
        genres = movie_model.get_all_genres()
        db = get_db()
        result = []
        for g in genres:
            row = db.fetch_one(
                f"SELECT COUNT(*) as cnt FROM {DianyingMovieModel.TABLE_NAME} WHERE genre LIKE ?",
                (f"%{g}%",)
            )
            result.append({'genre': g, 'count': row['cnt'] if row else 0})
        result.sort(key=lambda x: x['count'], reverse=True)
        return {'code': 0, 'message': 'success', 'data': result}

    def get_year_distribution(self) -> Dict[str, Any]:
        db = get_db()
        rows = db.fetch_all(
            f"SELECT year, COUNT(*) as count FROM {DianyingMovieModel.TABLE_NAME} WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC"
        )
        return {'code': 0, 'message': 'success', 'data': rows}
