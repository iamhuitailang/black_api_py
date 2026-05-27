from sqlalchemy.orm import Session
from ..models import User
from ..utils import hash_password, verify_password, create_access_token, to_json_field, parse_json_field
from datetime import datetime


class UserBusiness:
    @staticmethod
    def create_user(db: Session, username: str, password: str, email: str = None, nickname: str = None):
        hashed_pwd = hash_password(password)
        user = User(
            username=username,
            password=hashed_pwd,
            email=email,
            nickname=nickname or username,
            current_character_id=1,
            current_level_id=1
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str):
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        user = UserBusiness.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    @staticmethod
    def login(db: Session, username: str, password: str):
        user = UserBusiness.authenticate_user(db, username, password)
        if not user:
            return None
        token = create_access_token({"sub": username, "user_id": user.id})
        return {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "email": user.email,
                "avatar": user.avatar,
                "current_character_id": user.current_character_id,
                "current_level_id": user.current_level_id
            }
        }

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs):
        user = UserBusiness.get_user_by_id(db, user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str):
        user = UserBusiness.get_user_by_id(db, user_id)
        if not user:
            return False
        if not verify_password(old_password, user.password):
            return False
        user.password = hash_password(new_password)
        db.commit()
        return True

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = UserBusiness.get_user_by_id(db, user_id)
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True

    @staticmethod
    def set_current_character(db: Session, user_id: int, character_id: int):
        return UserBusiness.update_user(db, user_id, current_character_id=character_id)

    @staticmethod
    def set_current_level(db: Session, user_id: int, level_id: int):
        return UserBusiness.update_user(db, user_id, current_level_id=level_id)
