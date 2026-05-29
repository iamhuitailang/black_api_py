from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..db.database import get_db
from ..business import MovieBusiness
from .user_controller import get_current_admin, get_current_user

router = APIRouter(prefix="/api/movies", tags=["电影管理"])


class MovieCreate(BaseModel):
    title: str
    poster: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    actors: Optional[str] = None
    description: Optional[str] = None
    trailer: Optional[str] = None
    duration: Optional[int] = None
    country: Optional[str] = None


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    poster: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    actors: Optional[str] = None
    description: Optional[str] = None
    trailer: Optional[str] = None
    duration: Optional[int] = None
    country: Optional[str] = None


@router.post("/")
def create_movie(movie: MovieCreate, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    db_movie = MovieBusiness.create_movie(db, **movie.dict())
    return {
        "code": 200,
        "message": "创建成功",
        "data": {
            "id": db_movie.id,
            "title": db_movie.title,
            "poster": db_movie.poster,
            "rating": db_movie.rating,
            "rating_count": db_movie.rating_count,
            "year": db_movie.year,
            "genre": db_movie.genre,
            "director": db_movie.director,
            "actors": db_movie.actors,
            "description": db_movie.description,
            "trailer": db_movie.trailer,
            "duration": db_movie.duration,
            "country": db_movie.country,
            "created_at": db_movie.created_at
        }
    }


@router.get("/")
def list_movies(
    skip: int = 0,
    limit: int = 20,
    genre: Optional[str] = None,
    year: Optional[int] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=10),
    max_rating: Optional[float] = Query(None, ge=0, le=10),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    movies, total = MovieBusiness.list_movies(
        db,
        skip=skip,
        limit=limit,
        genre=genre,
        year=year,
        min_rating=min_rating,
        max_rating=max_rating,
        search=search
    )
    return {
        "code": 200,
        "message": "成功",
        "data": {
            "list": [
                {
                    "id": m.id,
                    "title": m.title,
                    "poster": m.poster,
                    "rating": m.rating,
                    "rating_count": m.rating_count,
                    "year": m.year,
                    "genre": m.genre,
                    "director": m.director,
                    "actors": m.actors,
                    "description": m.description,
                    "trailer": m.trailer,
                    "duration": m.duration,
                    "country": m.country
                }
                for m in movies
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    }


@router.get("/genres")
def get_genres(db: Session = Depends(get_db)):
    genres = MovieBusiness.get_all_genres(db)
    return {"code": 200, "message": "成功", "data": genres}


@router.get("/years")
def get_years(db: Session = Depends(get_db)):
    years = MovieBusiness.get_all_years(db)
    return {"code": 200, "message": "成功", "data": years}


@router.get("/recommended")
def get_recommended_movies(limit: int = 10, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    movies = MovieBusiness.get_recommended_movies(db, user_id=current_user.id, limit=limit)
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
                "genre": m.genre
            }
            for m in movies
        ]
    }


@router.get("/{movie_id}")
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    db_movie = MovieBusiness.get_movie(db, movie_id=movie_id)
    if db_movie is None:
        raise HTTPException(status_code=404, detail="电影不存在")
    return {
        "code": 200,
        "message": "成功",
        "data": {
            "id": db_movie.id,
            "title": db_movie.title,
            "poster": db_movie.poster,
            "rating": db_movie.rating,
            "rating_count": db_movie.rating_count,
            "year": db_movie.year,
            "genre": db_movie.genre,
            "director": db_movie.director,
            "actors": db_movie.actors,
            "description": db_movie.description,
            "trailer": db_movie.trailer,
            "duration": db_movie.duration,
            "country": db_movie.country,
            "created_at": db_movie.created_at
        }
    }


@router.put("/{movie_id}")
def update_movie(movie_id: int, movie: MovieUpdate, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    db_movie = MovieBusiness.update_movie(db, movie_id=movie_id, **movie.dict(exclude_unset=True))
    if db_movie is None:
        raise HTTPException(status_code=404, detail="电影不存在")
    return {
        "code": 200,
        "message": "更新成功",
        "data": {
            "id": db_movie.id,
            "title": db_movie.title,
            "poster": db_movie.poster,
            "rating": db_movie.rating,
            "rating_count": db_movie.rating_count,
            "year": db_movie.year,
            "genre": db_movie.genre,
            "director": db_movie.director,
            "actors": db_movie.actors,
            "description": db_movie.description,
            "trailer": db_movie.trailer,
            "duration": db_movie.duration,
            "country": db_movie.country
        }
    }


@router.delete("/{movie_id}")
def delete_movie(movie_id: int, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    success = MovieBusiness.delete_movie(db, movie_id=movie_id)
    if not success:
        raise HTTPException(status_code=404, detail="电影不存在")
    return {"code": 200, "message": "删除成功", "data": None}
