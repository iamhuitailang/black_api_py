from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate, UserLogin
import hashlib
import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("YIZI_SECRET_KEY", "yizi_game_secret_key_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


class UserService:
    @staticmethod
    def register(db: Session, user_data: UserCreate):
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            return None, "用户名已存在"

        hashed_pw = hash_password(user_data.password)
        new_user = User(
            username=user_data.username,
            password=hashed_pw,
            nickname=user_data.nickname or f"椅子斗士_{user_data.username}"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user, None

    @staticmethod
    def login(db: Session, login_data: UserLogin):
        user = db.query(User).filter(User.username == login_data.username).first()
        if not user:
            return None, "用户不存在"

        if not verify_password(login_data.password, user.password):
            return None, "密码错误"

        token = create_access_token({"user_id": user.id, "username": user.username})
        return {"user": user, "token": token}, None

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update_user_stats(db: Session, user_id: int, win: bool):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_games += 1
            if win:
                user.win_count += 1
            else:
                user.lose_count += 1
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def list_users(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
