from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import User, Park
from model.kl_model.schemas.user import UserCreate, UserUpdate
from model.kl_model.core.security import get_password_hash, verify_password, create_access_token


class UserBusiness:
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
    def create_user(db: Session, user: UserCreate) -> User:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password
        )
        db.add(db_user)
        db.flush()
        
        default_park = Park(
            user_id=db_user.id,
            name=f"{user.username}的恐龙公园",
            description="欢迎来到我的恐龙公园！"
        )
        db.add(default_park)
        
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        db_user = UserBusiness.get_user(db, user_id)
        if not db_user:
            return None
        update_data = user_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        db_user = UserBusiness.get_user(db, user_id)
        if not db_user:
            return False
        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        user = UserBusiness.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> Optional[User]:
        db_user = UserBusiness.get_user(db, user_id)
        if not db_user:
            return None
        if not verify_password(old_password, db_user.password_hash):
            return None
        db_user.password_hash = get_password_hash(new_password)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_balance(db: Session, user_id: int, coins: float = 0, diamonds: float = 0) -> Optional[User]:
        db_user = UserBusiness.get_user(db, user_id)
        if not db_user:
            return None
        db_user.coins += coins
        db_user.diamonds += diamonds
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def add_experience(db: Session, user_id: int, exp: int) -> Optional[User]:
        db_user = UserBusiness.get_user(db, user_id)
        if not db_user:
            return None
        db_user.experience += exp
        exp_needed = db_user.level * 1000
        while db_user.experience >= exp_needed:
            db_user.experience -= exp_needed
            db_user.level += 1
            exp_needed = db_user.level * 1000
        db.commit()
        db.refresh(db_user)
        return db_user
