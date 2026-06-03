from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from models import User, UserProgress
from schemas import UserCreate, UserUpdate
from .auth_service import get_password_hash, verify_password, create_access_token


class UserService:
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user: UserCreate):
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password,
            nickname=user.nickname,
            avatar=user.avatar
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        db_progress = UserProgress(
            user_id=db_user.id
        )
        db.add(db_progress)
        db.commit()

        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
        db_user = UserService.get_user(db, user_id)
        if db_user:
            update_data = user.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        db_user = UserService.get_user(db, user_id)
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        user = UserService.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login_user(db: Session, username: str, password: str):
        user = UserService.authenticate_user(db, username, password)
        if not user:
            return None
        token = create_access_token(data={"sub": str(user.id)})
        return {"user": user, "token": token}
