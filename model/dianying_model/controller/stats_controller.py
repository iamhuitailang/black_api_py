from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..business import StatsBusiness
from .user_controller import get_current_admin

router = APIRouter(prefix="/api/stats", tags=["数据统计"])


@router.get("/dashboard")
def get_dashboard_stats(current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    stats = StatsBusiness.get_dashboard_stats(db)
    return {"code": 200, "message": "成功", "data": stats}


@router.get("/rating-distribution")
def get_rating_distribution(current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    distribution = StatsBusiness.get_rating_distribution(db)
    return {"code": 200, "message": "成功", "data": distribution}


@router.get("/top-movies")
def get_top_movies(limit: int = 10, db: Session = Depends(get_db)):
    movies = StatsBusiness.get_top_movies(db, limit=limit)
    return {"code": 200, "message": "成功", "data": movies}


@router.get("/popular-movies")
def get_popular_movies(limit: int = 10, current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    movies = StatsBusiness.get_most_popular_movies(db, limit=limit)
    return {"code": 200, "message": "成功", "data": movies}


@router.get("/genre-distribution")
def get_genre_distribution(current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    distribution = StatsBusiness.get_genre_distribution(db)
    return {"code": 200, "message": "成功", "data": distribution}


@router.get("/year-distribution")
def get_year_distribution(current_user=Depends(get_current_admin), db: Session = Depends(get_db)):
    distribution = StatsBusiness.get_year_distribution(db)
    return {"code": 200, "message": "成功", "data": distribution}
