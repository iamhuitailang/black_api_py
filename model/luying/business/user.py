from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from models import User
from schemas import UserCreate, UserUpdate
import hashlib
import secrets
import json
from datetime import datetime


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split('$')
        verify = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return verify.hex() == hashed
    except:
        return False


def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(
        username=user.username,
        password=hash_password(user.password),
        nickname=user.nickname or user.username,
        email=user.email,
        phone=user.phone,
        bio=user.bio,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_id(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()


def get_user_list(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    query = db.query(User).filter(User.role == "user")
    if keyword:
        query = query.filter(or_(User.username.contains(keyword), User.nickname.contains(keyword)))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def get_user_follow_stats(db: Session, user_id: int) -> dict:
    from models import Follow
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    follower_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    return {"following_count": following_count, "follower_count": follower_count}


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
