from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Campsite, Review, Favorite, User
from schemas import CampsiteCreate, CampsiteUpdate, ReviewCreate, ReviewUpdate
from datetime import datetime


def create_campsite(db: Session, campsite: CampsiteCreate, user_id: int) -> Campsite:
    db_campsite = Campsite(
        name=campsite.name,
        location=campsite.location,
        latitude=campsite.latitude,
        longitude=campsite.longitude,
        description=campsite.description,
        cover_image=campsite.cover_image,
        images=campsite.images,
        facilities=campsite.facilities,
        best_season=campsite.best_season,
        difficulty=campsite.difficulty,
        price_info=campsite.price_info,
        tips=campsite.tips,
        created_by=user_id,
    )
    db.add(db_campsite)
    db.commit()
    db.refresh(db_campsite)
    return db_campsite


def get_campsite_by_id(db: Session, campsite_id: int) -> Campsite:
    db_campsite = db.query(Campsite).filter(Campsite.id == campsite_id).first()
    if db_campsite:
        try:
            db_campsite.view_count = (db_campsite.view_count or 0) + 1
            db.commit()
            db.refresh(db_campsite)
        except Exception:
            db.rollback()
    return db_campsite


def get_campsite_list(db: Session, page: int = 1, page_size: int = 10, keyword: str = None, difficulty: str = None) -> dict:
    query = db.query(Campsite).filter(Campsite.status == 1)
    if keyword:
        query = query.filter(or_(Campsite.name.contains(keyword), Campsite.location.contains(keyword)))
    if difficulty:
        query = query.filter(Campsite.difficulty == difficulty)
    total = query.count()
    items = query.order_by(Campsite.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def update_campsite(db: Session, campsite_id: int, campsite_update: CampsiteUpdate) -> Campsite:
    db_campsite = get_campsite_by_id(db, campsite_id)
    if not db_campsite:
        return None
    update_data = campsite_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campsite, key, value)
    db_campsite.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_campsite)
    return db_campsite


def delete_campsite(db: Session, campsite_id: int) -> bool:
    db_campsite = get_campsite_by_id(db, campsite_id)
    if not db_campsite:
        return False
    db_campsite.status = 0
    db.commit()
    return True


def create_review(db: Session, review: ReviewCreate, user_id: int) -> Review:
    db_review = Review(
        campsite_id=review.campsite_id,
        user_id=user_id,
        rating=review.rating,
        content=review.content,
        images=review.images,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


def get_reviews_by_campsite(db: Session, campsite_id: int, page: int = 1, page_size: int = 10) -> dict:
    query = db.query(Review).filter(Review.campsite_id == campsite_id)
    total = query.count()
    items = query.order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def delete_review(db: Session, review_id: int) -> bool:
    db_review = db.query(Review).filter(Review.id == review_id).first()
    if not db_review:
        return False
    db.delete(db_review)
    db.commit()
    return True


def create_favorite(db: Session, campsite_id: int, user_id: int) -> Favorite:
    db_favorite = db.query(Favorite).filter(
        Favorite.campsite_id == campsite_id,
        Favorite.user_id == user_id
    ).first()
    if db_favorite:
        return db_favorite
    db_favorite = Favorite(
        campsite_id=campsite_id,
        user_id=user_id,
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


def delete_favorite(db: Session, campsite_id: int, user_id: int) -> bool:
    db_favorite = db.query(Favorite).filter(
        Favorite.campsite_id == campsite_id,
        Favorite.user_id == user_id
    ).first()
    if not db_favorite:
        return False
    db.delete(db_favorite)
    db.commit()
    return True


def is_favorited(db: Session, campsite_id: int, user_id: int) -> bool:
    return db.query(Favorite).filter(
        Favorite.campsite_id == campsite_id,
        Favorite.user_id == user_id
    ).first() is not None


def get_user_favorites(db: Session, user_id: int, page: int = 1, page_size: int = 10) -> dict:
    query = db.query(Campsite).join(Favorite, Favorite.campsite_id == Campsite.id).filter(
        Favorite.user_id == user_id,
        Campsite.status == 1
    )
    total = query.count()
    items = query.order_by(Favorite.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def campsite_to_dict(campsite: Campsite, include_details: bool = False) -> dict:
    data = {
        "id": campsite.id,
        "name": campsite.name,
        "location": campsite.location,
        "latitude": campsite.latitude,
        "longitude": campsite.longitude,
        "description": campsite.description,
        "cover_image": campsite.cover_image,
        "facilities": campsite.facilities,
        "best_season": campsite.best_season,
        "difficulty": campsite.difficulty,
        "price_info": campsite.price_info,
        "tips": campsite.tips,
        "view_count": campsite.view_count,
        "status": campsite.status,
        "created_at": campsite.created_at.isoformat() if campsite.created_at else None,
    }
    if include_details:
        data["images"] = campsite.images
    return data


def review_to_dict(review: Review) -> dict:
    return {
        "id": review.id,
        "campsite_id": review.campsite_id,
        "user_id": review.user_id,
        "username": review.user.username if review.user else None,
        "nickname": review.user.nickname if review.user else None,
        "avatar": review.user.avatar if review.user else None,
        "rating": review.rating,
        "content": review.content,
        "images": review.images,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }
