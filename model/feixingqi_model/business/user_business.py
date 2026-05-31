from sqlalchemy.orm import Session
from model.feixingqi_model.models.user import User
from model.feixingqi_model.utils import hash_password
from typing import List, Optional

class UserBusiness:
    @staticmethod
    def create_user(db: Session, username: str, password: str, nickname: str = None) -> User:
        hashed_pwd = hash_password(password)
        user = User(
            username=username,
            password=hashed_pwd,
            nickname=nickname or username,
            avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_list(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> tuple:
        query = db.query(User)
        if keyword:
            query = query.filter(User.username.contains(keyword) | User.nickname.contains(keyword))
        total = query.count()
        users = query.offset((page - 1) * page_size).limit(page_size).all()
        return users, total

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                if key == 'password' and value:
                    value = hash_password(value)
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.username == username).first()
        if user and user.password == hash_password(password) and user.status == 1:
            return user
        return None

    @staticmethod
    def update_score(db: Session, user_id: int, score_change: int, is_win: bool) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.score = max(0, user.score + score_change)
            if is_win:
                user.wins += 1
            else:
                user.losses += 1
            user.exp += 10 if is_win else 5
            if user.exp >= user.level * 100:
                user.level += 1
                user.exp = 0
            db.commit()
            db.refresh(user)
        return user
