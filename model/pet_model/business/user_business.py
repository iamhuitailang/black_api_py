from typing import List, Optional
from sqlalchemy.orm import Session
from model.pet_model.models.user import User
from model.pet_model.schemas.user import UserCreate, UserUpdate
import hashlib


def get_password_hash(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone == phone).first()


def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        password=hashed_password,
        nickname=user.nickname or user.username,
        phone=user.phone,
        email=user.email,
        role=user.role or "user",
        avatar=user.avatar,
        address=user.address,
        description=user.description,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def get_user_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[int] = None,
) -> tuple[List[User], int]:
    query = db.query(User)
    if keyword:
        query = query.filter(
            (User.username.contains(keyword))
            | (User.nickname.contains(keyword))
            | (User.phone.contains(keyword))
        )
    if role:
        query = query.filter(User.role == role)
    if status is not None:
        query = query.filter(User.status == status)
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return users, total
