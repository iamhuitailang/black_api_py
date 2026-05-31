from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.user import User
from ..models.game_record import GameRecord
import hashlib
import jwt
import datetime
from sqlalchemy import func

SECRET_KEY = "cs_game_secret_key_2024"

class UserBusiness:
    @staticmethod
    def hash_password(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        return UserBusiness.hash_password(password) == hashed

    @staticmethod
    def create_token(user_id: int, username: str) -> str:
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
            return None

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, username: str, password: str, email: str = "",
                    nickname: str = "", avatar: str = "") -> Optional[User]:
        if UserBusiness.get_user_by_username(db, username):
            return None
        hashed_password = UserBusiness.hash_password(password)
        db_user = User(
            username=username,
            password=hashed_password,
            email=email,
            nickname=nickname or username,
            avatar=avatar
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            if "password" in kwargs:
                kwargs["password"] = UserBusiness.hash_password(kwargs["password"])
            for key, value in kwargs.items():
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
        user = UserBusiness.get_user_by_username(db, username)
        if user and UserBusiness.verify_password(password, user.password):
            return user
        return None

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> dict:
        records = db.query(GameRecord).filter(GameRecord.user_id == user_id).all()
        total_kills = sum(r.kills for r in records)
        total_deaths = sum(r.deaths for r in records)
        total_wins = sum(1 for r in records if r.is_win)
        total_games = len(records)
        kd_ratio = total_kills / max(total_deaths, 1)
        return {
            "total_kills": total_kills,
            "total_deaths": total_deaths,
            "total_wins": total_wins,
            "total_games": total_games,
            "kd_ratio": round(kd_ratio, 2)
        }

    @staticmethod
    def get_leaderboard(db: Session, limit: int = 20) -> List[dict]:
        result = db.query(
            User.id,
            User.username,
            User.nickname,
            User.avatar,
            func.sum(GameRecord.kills).label('total_kills'),
            func.sum(GameRecord.deaths).label('total_deaths')
        ).outerjoin(GameRecord, User.id == GameRecord.user_id)\
         .group_by(User.id)\
         .order_by(func.sum(GameRecord.kills).desc())\
         .limit(limit).all()
        
        leaderboard = []
        for i, row in enumerate(result):
            total_kills = row.total_kills or 0
            total_deaths = row.total_deaths or 0
            leaderboard.append({
                "rank": i + 1,
                "id": row.id,
                "username": row.username,
                "nickname": row.nickname,
                "avatar": row.avatar,
                "total_kills": total_kills,
                "total_deaths": total_deaths,
                "kd_ratio": round(total_kills / max(total_deaths, 1), 2)
            })
        return leaderboard
