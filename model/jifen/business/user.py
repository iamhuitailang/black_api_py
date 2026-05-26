from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from typing import List, Optional
import random
import string

from models.user import User
from schemas.user import UserCreate, UserUpdate, UserPointsUpdate
from utils.auth import hash_password, verify_password, create_access_token


class UserBusiness:

    @staticmethod
    def generate_invite_code() -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    @staticmethod
    def register(db: Session, user_create: UserCreate) -> User:
        existing_user = db.query(User).filter(User.username == user_create.username).first()
        if existing_user:
            raise ValueError("用户名已存在")

        invite_code = UserBusiness.generate_invite_code()
        while db.query(User).filter(User.invite_code == invite_code).first():
            invite_code = UserBusiness.generate_invite_code()

        invited_by = 0
        if user_create.invite_code:
            inviter = db.query(User).filter(User.invite_code == user_create.invite_code).first()
            if inviter:
                invited_by = inviter.id

        db_user = User(
            username=user_create.username,
            password=hash_password(user_create.password),
            nickname=user_create.nickname or user_create.username,
            avatar=user_create.avatar or "",
            phone=user_create.phone or "",
            email=user_create.email or "",
            invite_code=invite_code,
            invited_by=invited_by,
            role="user"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def login(db: Session, username: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        if user.status != "active":
            return None
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_user_points(db: Session, user_id: int, points: int,
                           description: str = "", points_type: str = "task") -> User:
        from models.points_record import PointsRecord
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")

        old_points = user.points
        user.points = user.points + points
        if points > 0:
            user.total_points = user.total_points + points
        db.commit()
        db.refresh(user)

        record = PointsRecord(
            user_id=user_id,
            points=points,
            type=points_type,
            description=description,
            balance_after=user.points
        )
        db.add(record)
        db.commit()

        return user

    @staticmethod
    def update_profile_completed(db: Session, user_id: int) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")
        if user.profile_completed:
            raise ValueError("已完成过资料完善")
        user.profile_completed = True
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list_users(db: Session, page: int = 1, page_size: int = 10,
                   keyword: str = "") -> tuple:
        query = db.query(User)
        if keyword:
            query = query.filter(or_(
                User.username.contains(keyword),
                User.nickname.contains(keyword),
                User.phone.contains(keyword)
            ))
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()
        return users, total

    @staticmethod
    def update_user_role(db: Session, user_id: int, role: str) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.role = role
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_user_status(db: Session, user_id: int, status: str) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.status = status
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_points_rank(db: Session, limit: int = 20) -> List[dict]:
        users = db.query(User).filter(User.role == "user").order_by(
            User.total_points.desc()).limit(limit).all()
        result = []
        for i, user in enumerate(users):
            result.append({
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar": user.avatar,
                "points": user.points,
                "total_points": user.total_points,
                "rank": i + 1
            })
        return result

    @staticmethod
    def get_user_rank(db: Session, user_id: int) -> Optional[dict]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        rank = db.query(User).filter(
            User.role == "user",
            User.total_points > user.total_points
        ).count() + 1
        return {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "points": user.points,
            "total_points": user.total_points,
            "rank": rank
        }

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        db.delete(user)
        db.commit()
        return True
