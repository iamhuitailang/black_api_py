from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..db.database import get_db
from ..business import RatingBusiness
from .user_controller import get_current_user, get_current_admin

router = APIRouter(prefix="/api/ratings", tags=["评分管理"])


class RatingCreate(BaseModel):
    movie_id: int
    score: float = Query(..., ge=1, le=10)


@router.post("/")
def create_rating(rating: RatingCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_rating = RatingBusiness.create_rating(db, user_id=current_user.id, movie_id=rating.movie_id, score=rating.score)
    return {
        "code": 200,
        "message": "评分成功",
        "data": {
            "id": db_rating.id,
            "user_id": db_rating.user_id,
            "movie_id": db_rating.movie_id,
            "score": db_rating.score,
            "created_at": db_rating.created_at,
            "updated_at": db_rating.updated_at
        }
    }


@router.get("/user/{user_id}")
def list_user_ratings(user_id: int, skip: int = 0, limit: int = 100, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权限查看他人评分")
    ratings = RatingBusiness.list_ratings_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "成功",
        "data": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "movie_id": r.movie_id,
                "score": r.score,
                "created_at": r.created_at,
                "updated_at": r.updated_at
            }
            for r in ratings
        ]
    }


@router.get("/movie/{movie_id}")
def list_movie_ratings(movie_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ratings = RatingBusiness.list_ratings_by_movie(db, movie_id=movie_id, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "成功",
        "data": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "movie_id": r.movie_id,
                "score": r.score,
                "created_at": r.created_at
            }
            for r in ratings
        ]
    }


@router.get("/my/{movie_id}")
def get_my_rating(movie_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rating = RatingBusiness.get_user_movie_rating(db, user_id=current_user.id, movie_id=movie_id)
    return {
        "code": 200,
        "message": "成功",
        "data": {
            "id": rating.id,
            "score": rating.score,
            "created_at": rating.created_at,
            "updated_at": rating.updated_at
        } if rating else None
    }


@router.get("/my")
def get_my_ratings(skip: int = 0, limit: int = 100, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    ratings = RatingBusiness.list_ratings_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return {
        "code": 200,
        "message": "成功",
        "data": [
            {
                "id": r.id,
                "movie_id": r.movie_id,
                "score": r.score,
                "created_at": r.created_at,
                "updated_at": r.updated_at
            }
            for r in ratings
        ]
    }


@router.delete("/{rating_id}")
def delete_rating(rating_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_rating = RatingBusiness.get_rating(db, rating_id=rating_id)
    if not db_rating:
        raise HTTPException(status_code=404, detail="评分不存在")
    if db_rating.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权限删除他人评分")
    success = RatingBusiness.delete_rating(db, rating_id=rating_id)
    if not success:
        raise HTTPException(status_code=404, detail="评分不存在")
    return {"code": 200, "message": "删除成功", "data": None}
