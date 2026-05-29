from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.user import User
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "dianying_secret_key_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserBusiness:
    @staticmethod
    def create_user(db: Session, username: str, password: str, email: str = None) -> User:
        hashed_password = pwd_context.hash(password)
        db_user = User(username=username, password=hashed_password, email=email, role="user")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_admin(db: Session, username: str, password: str, email: str = None) -> User:
        hashed_password = pwd_context.hash(password)
        db_user = User(username=username, password=hashed_password, email=email, role="admin")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

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
    def list_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            for key, value in kwargs.items():
                if key == "password":
                    value = pwd_context.hash(value)
                setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        user = UserBusiness.get_user_by_username(db, username)
        if not user:
            return None
        if not UserBusiness.verify_password(password, user.password):
            return None
        return user

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return {}

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> bool:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user and UserBusiness.verify_password(old_password, db_user.password):
            db_user.password = pwd_context.hash(new_password)
            db.commit()
            return True
        return False
