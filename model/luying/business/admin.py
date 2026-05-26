from sqlalchemy.orm import Session
from sqlalchemy import func
from models import User, CampingPlan, Equipment, Campsite, Post
from datetime import datetime, timedelta


def get_statistics(db: Session) -> dict:
    user_count = db.query(User).filter(User.role == "user").count()
    plan_count = db.query(CampingPlan).count()
    equipment_count = db.query(Equipment).count()
    campsite_count = db.query(Campsite).filter(Campsite.status == 1).count()
    post_count = db.query(Post).filter(Post.status == 1).count()

    today = datetime.utcnow()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    recent_users = db.query(User).filter(User.created_at >= week_ago).filter(User.role == "user").order_by(User.created_at.desc()).limit(10).all()
    recent_posts = db.query(Post).filter(Post.created_at >= week_ago).filter(Post.status == 1).order_by(Post.created_at.desc()).limit(10).all()

    daily_stats = []
    for i in range(7):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        new_users = db.query(User).filter(User.created_at >= day_start, User.created_at <= day_end, User.role == "user").count()
        new_posts = db.query(Post).filter(Post.created_at >= day_start, Post.created_at <= day_end, Post.status == 1).count()
        new_plans = db.query(CampingPlan).filter(CampingPlan.created_at >= day_start, CampingPlan.created_at <= day_end).count()
        daily_stats.append({
            "date": day.strftime("%Y-%m-%d"),
            "new_users": new_users,
            "new_posts": new_posts,
            "new_plans": new_plans,
        })
    daily_stats.reverse()

    return {
        "user_count": user_count,
        "plan_count": plan_count,
        "equipment_count": equipment_count,
        "campsite_count": campsite_count,
        "post_count": post_count,
        "recent_users": [
            {"id": u.id, "username": u.username, "nickname": u.nickname, "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in recent_users
        ],
        "recent_posts": [
            {"id": p.id, "title": p.title, "username": p.user.username if p.user else None, "created_at": p.created_at.isoformat() if p.created_at else None}
            for p in recent_posts
        ],
        "daily_stats": daily_stats,
    }


def get_all_users(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    from business.user import get_user_list
    return get_user_list(db, page, page_size, keyword)


def get_all_equipments(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    from models import Equipment
    query = db.query(Equipment)
    if keyword:
        query = query.filter(Equipment.name.contains(keyword))
    total = query.count()
    items = query.order_by(Equipment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def get_all_campsites(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    from models import Campsite
    query = db.query(Campsite)
    if keyword:
        query = query.filter(Campsite.name.contains(keyword))
    total = query.count()
    items = query.order_by(Campsite.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def get_all_posts(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    from models import Post
    query = db.query(Post)
    if keyword:
        query = query.filter(Post.title.contains(keyword))
    total = query.count()
    items = query.order_by(Post.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def get_all_plans(db: Session, page: int = 1, page_size: int = 10) -> dict:
    from models import CampingPlan
    query = db.query(CampingPlan)
    total = query.count()
    items = query.order_by(CampingPlan.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}
