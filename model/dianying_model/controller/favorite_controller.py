from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..db.database import get_db
from ..business import FavoriteBusiness
from .user_controller import get_current_user, get_current_admin

router = APIRouter(prefix="/api/favorites", tags=["收藏管理"])


class FavoriteCreate(BaseModel):
    movie_id: int


@router.post("/")
def create_favorite(favorite: FavoriteCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_favorite = FavoriteBusiness.create_favorite(db, user_id=current_user.id, movie_id=favorite.movie_id)
    return {
        "code": 200,
        "message": "收藏成功",
        "data": {
            "id": db_favorite.id,
            "user_id": db_favorite.user_id,
            "movie_id": db_favorite.movie_id,
            "created_at": db_favorite.created_at
        }
    }


@router.get("/check/{movie_id}")
def check_favorite(movie_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    is_favorite = FavoriteBusiness.check_favorite(db, user_id=current_user.id, movie_id=movie_id)
    return {"code": 200, "message": "成功", "data": {"is_favorite": is_favorite}}


@router.get("/my")
def get_my_favorites(skip: int = 0, limit: int = 100, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    movies = FavoriteBusiness.list_favorites_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "成功",
        "data": [
            {
                "id": m.id,
                "title": m.title,
                "poster": m.poster,
                "rating": m.rating,
                "rating_count": m.rating_count,
                "year": m.year,
                "genre": m.genre,
                "director": m.director,
                "actors": m.actors
            }
            for m in movies
        ]
    }


@router.get("/my/ids")
def get_my_favorite_ids(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ids = FavoriteBusiness.list_favorite_ids_by_user(db, user_id=current_user.id)
    return {"code": 200, "message": "成功", "data": ids}


@router.delete("/{movie_id}")
def delete_favorite(movie_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    success = FavoriteBusiness.delete_favorite(db, user_id=current_user.id, movie_id=movie_id)
    if not success:
        raise HTTPException(status_code=404, detail="收藏不存在")
    return {"code": 200, "message": "取消收藏成功", "data": None}
