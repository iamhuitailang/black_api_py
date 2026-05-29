from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from ..models.movie import Movie
from ..models.rating import Rating


class MovieBusiness:
    @staticmethod
    def create_movie(db: Session, **kwargs) -> Movie:
        db_movie = Movie(**kwargs)
        db.add(db_movie)
        db.commit()
        db.refresh(db_movie)
        return db_movie

    @staticmethod
    def get_movie(db: Session, movie_id: int) -> Optional[Movie]:
        return db.query(Movie).filter(Movie.id == movie_id).first()

    @staticmethod
    def list_movies(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        genre: str = None,
        year: int = None,
        min_rating: float = None,
        max_rating: float = None,
        search: str = None
    ) -> tuple[List[Movie], int]:
        query = db.query(Movie)
        
        if genre:
            query = query.filter(Movie.genre.like(f"%{genre}%"))
        if year:
            query = query.filter(Movie.year == year)
        if min_rating:
            query = query.filter(Movie.rating >= min_rating)
        if max_rating:
            query = query.filter(Movie.rating <= max_rating)
        if search:
            query = query.filter(
                or_(
                    Movie.title.like(f"%{search}%"),
                    Movie.actors.like(f"%{search}%"),
                    Movie.director.like(f"%{search}%")
                )
            )
        
        total = query.count()
        movies = query.order_by(Movie.rating.desc(), Movie.created_at.desc()).offset(skip).limit(limit).all()
        return movies, total

    @staticmethod
    def update_movie(db: Session, movie_id: int, **kwargs) -> Optional[Movie]:
        db_movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if db_movie:
            for key, value in kwargs.items():
                setattr(db_movie, key, value)
            db.commit()
            db.refresh(db_movie)
        return db_movie

    @staticmethod
    def delete_movie(db: Session, movie_id: int) -> bool:
        db_movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if db_movie:
            db.delete(db_movie)
            db.commit()
            return True
        return False

    @staticmethod
    def update_rating(db: Session, movie_id: int) -> None:
        ratings = db.query(Rating).filter(Rating.movie_id == movie_id).all()
        if ratings:
            avg_score = sum(r.score for r in ratings) / len(ratings)
            count = len(ratings)
            db.query(Movie).filter(Movie.id == movie_id).update(
                {"rating": round(avg_score, 1), "rating_count": count}
            )
            db.commit()

    @staticmethod
    def get_all_genres(db: Session) -> List[str]:
        movies = db.query(Movie).all()
        genres = set()
        for movie in movies:
            if movie.genre:
                for g in movie.genre.split(","):
                    genres.add(g.strip())
        return sorted(list(genres))

    @staticmethod
    def get_all_years(db: Session) -> List[int]:
        years = db.query(Movie.year).filter(Movie.year.isnot(None)).distinct().order_by(Movie.year.desc()).all()
        return [y[0] for y in years]

    @staticmethod
    def get_recommended_movies(db: Session, user_id: int, limit: int = 10) -> List[Movie]:
        user_ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
        
        if not user_ratings:
            return db.query(Movie).order_by(Movie.rating.desc(), Movie.rating_count.desc()).limit(limit).all()
        
        high_rated = [r for r in user_ratings if r.score >= 7]
        if not high_rated:
            high_rated = user_ratings
        
        movie_ids = [r.movie_id for r in high_rated]
        rated_movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all()
        
        genres = set()
        for movie in rated_movies:
            if movie.genre:
                for g in movie.genre.split(","):
                    genres.add(g.strip())
        
        query = db.query(Movie).filter(Movie.id.notin_([r.movie_id for r in user_ratings]))
        genre_filters = [Movie.genre.like(f"%{g}%") for g in genres]
        if genre_filters:
            query = query.filter(or_(*genre_filters))
        
        return query.order_by(Movie.rating.desc(), Movie.rating_count.desc()).limit(limit).all()
