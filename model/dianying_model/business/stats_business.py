from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List
from ..models.movie import Movie
from ..models.rating import Rating
from ..models.user import User
from ..models.favorite import Favorite


class StatsBusiness:
    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict:
        total_movies = db.query(func.count(Movie.id)).scalar()
        total_users = db.query(func.count(User.id)).scalar()
        total_ratings = db.query(func.count(Rating.id)).scalar()
        total_favorites = db.query(func.count(Favorite.id)).scalar()
        avg_rating = db.query(func.avg(Movie.rating)).scalar() or 0

        return {
            "total_movies": total_movies,
            "total_users": total_users,
            "total_ratings": total_ratings,
            "total_favorites": total_favorites,
            "avg_rating": round(avg_rating, 2)
        }

    @staticmethod
    def get_rating_distribution(db: Session) -> List[Dict]:
        result = db.query(
            func.floor(Rating.score).label("score_range"),
            func.count(Rating.id).label("count")
        ).group_by(func.floor(Rating.score)).order_by("score_range").all()

        distribution = []
        for i in range(1, 11):
            count = 0
            for row in result:
                if row.score_range == i:
                    count = row.count
                    break
            distribution.append({"score": i, "count": count})

        return distribution

    @staticmethod
    def get_top_movies(db: Session, limit: int = 10) -> List[Dict]:
        movies = db.query(Movie).order_by(Movie.rating.desc(), Movie.rating_count.desc()).limit(limit).all()
        return [
            {
                "id": m.id,
                "title": m.title,
                "poster": m.poster,
                "rating": m.rating,
                "rating_count": m.rating_count,
                "year": m.year,
                "genre": m.genre
            }
            for m in movies
        ]

    @staticmethod
    def get_most_popular_movies(db: Session, limit: int = 10) -> List[Dict]:
        result = db.query(
            Movie.id,
            Movie.title,
            Movie.poster,
            Movie.rating,
            Movie.rating_count,
            func.count(Rating.id).label("rating_total")
        ).join(Rating, Movie.id == Rating.movie_id).group_by(Movie.id).order_by(func.count(Rating.id).desc()).limit(limit).all()

        return [
            {
                "id": row.id,
                "title": row.title,
                "poster": row.poster,
                "rating": row.rating,
                "rating_count": row.rating_count,
                "total_ratings": row.rating_total
            }
            for row in result
        ]

    @staticmethod
    def get_genre_distribution(db: Session) -> List[Dict]:
        movies = db.query(Movie).all()
        genre_counts = {}

        for movie in movies:
            if movie.genre:
                genres = [g.strip() for g in movie.genre.split(",")]
                for g in genres:
                    genre_counts[g] = genre_counts.get(g, 0) + 1

        return [{"genre": k, "count": v} for k, v in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)]

    @staticmethod
    def get_year_distribution(db: Session) -> List[Dict]:
        result = db.query(
            Movie.year,
            func.count(Movie.id).label("count")
        ).filter(Movie.year.isnot(None)).group_by(Movie.year).order_by(Movie.year.desc()).all()

        return [{"year": row.year, "count": row.count} for row in result]
