from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.rating import Rating
from .movie_business import MovieBusiness


class RatingBusiness:
    @staticmethod
    def create_rating(db: Session, user_id: int, movie_id: int, score: float) -> Rating:
        db_rating = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).first()
        if db_rating:
            db_rating.score = score
        else:
            db_rating = Rating(user_id=user_id, movie_id=movie_id, score=score)
            db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
        MovieBusiness.update_rating(db, movie_id)
        return db_rating

    @staticmethod
    def get_rating(db: Session, rating_id: int) -> Optional[Rating]:
        return db.query(Rating).filter(Rating.id == rating_id).first()

    @staticmethod
    def get_user_movie_rating(db: Session, user_id: int, movie_id: int) -> Optional[Rating]:
        return db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).first()

    @staticmethod
    def list_ratings_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Rating]:
        return db.query(Rating).filter(Rating.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def list_ratings_by_movie(db: Session, movie_id: int, skip: int = 0, limit: int = 100) -> List[Rating]:
        return db.query(Rating).filter(Rating.movie_id == movie_id).offset(skip).limit(limit).all()

    @staticmethod
    def delete_rating(db: Session, rating_id: int) -> bool:
        db_rating = db.query(Rating).filter(Rating.id == rating_id).first()
        if db_rating:
            movie_id = db_rating.movie_id
            db.delete(db_rating)
            db.commit()
            MovieBusiness.update_rating(db, movie_id)
            return True
        return False

    @staticmethod
    def delete_user_movie_rating(db: Session, user_id: int, movie_id: int) -> bool:
        db_rating = db.query(Rating).filter(Rating.user_id == user_id, Rating.movie_id == movie_id).first()
        if db_rating:
            db.delete(db_rating)
            db.commit()
            MovieBusiness.update_rating(db, movie_id)
            return True
        return False
