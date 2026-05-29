from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.favorite import Favorite
from ..models.movie import Movie


class FavoriteBusiness:
    @staticmethod
    def create_favorite(db: Session, user_id: int, movie_id: int) -> Favorite:
        db_favorite = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.movie_id == movie_id).first()
        if db_favorite:
            return db_favorite
        db_favorite = Favorite(user_id=user_id, movie_id=movie_id)
        db.add(db_favorite)
        db.commit()
        db.refresh(db_favorite)
        return db_favorite

    @staticmethod
    def get_favorite(db: Session, favorite_id: int) -> Optional[Favorite]:
        return db.query(Favorite).filter(Favorite.id == favorite_id).first()

    @staticmethod
    def check_favorite(db: Session, user_id: int, movie_id: int) -> bool:
        return db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.movie_id == movie_id).first() is not None

    @staticmethod
    def list_favorites_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Movie]:
        favorites = db.query(Favorite).filter(Favorite.user_id == user_id).offset(skip).limit(limit).all()
        movie_ids = [f.movie_id for f in favorites]
        return db.query(Movie).filter(Movie.id.in_(movie_ids)).order_by(Movie.rating.desc()).all()

    @staticmethod
    def list_favorite_ids_by_user(db: Session, user_id: int) -> List[int]:
        favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
        return [f.movie_id for f in favorites]

    @staticmethod
    def delete_favorite(db: Session, user_id: int, movie_id: int) -> bool:
        db_favorite = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.movie_id == movie_id).first()
        if db_favorite:
            db.delete(db_favorite)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_favorite_by_id(db: Session, favorite_id: int) -> bool:
        db_favorite = db.query(Favorite).filter(Favorite.id == favorite_id).first()
        if db_favorite:
            db.delete(db_favorite)
            db.commit()
            return True
        return False
