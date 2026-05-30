from sqlalchemy.orm import Session
from models.user import TbGuzhangModelUser
from models.game_record import TbGuzhangModelGameRecord
from utils.auth import get_password_hash, verify_password, create_access_token
from pydantic import BaseModel
from typing import Optional


class UserRegisterRequest(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = None


class UserLoginRequest(BaseModel):
    username: str
    password: str


class UserUpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UserInfoResponse(BaseModel):
    id: int
    username: str
    nickname: Optional[str]
    avatar: Optional[str]
    total_games: int
    total_wins: int
    highest_score: float

    class Config:
        from_attributes = True


class UserBusiness:
    @staticmethod
    def register(db: Session, request: UserRegisterRequest) -> dict:
        existing_user = db.query(TbGuzhangModelUser).filter(
            TbGuzhangModelUser.username == request.username
        ).first()
        if existing_user:
            raise Exception("用户名已存在")

        hashed_password = get_password_hash(request.password)
        user = TbGuzhangModelUser(
            username=request.username,
            password=hashed_password,
            nickname=request.nickname or request.username
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(data={"sub": user.username})
        return {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar": user.avatar
            }
        }

    @staticmethod
    def login(db: Session, request: UserLoginRequest) -> dict:
        user = db.query(TbGuzhangModelUser).filter(
            TbGuzhangModelUser.username == request.username
        ).first()
        if not user or not verify_password(request.password, user.password):
            raise Exception("用户名或密码错误")

        token = create_access_token(data={"sub": user.username})
        return {
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar": user.avatar
            }
        }

    @staticmethod
    def update_password(db: Session, user: TbGuzhangModelUser, request: UserUpdatePasswordRequest) -> bool:
        if not verify_password(request.old_password, user.password):
            raise Exception("原密码错误")

        if request.old_password == request.new_password:
            raise Exception("新密码不能与原密码相同")

        user.password = get_password_hash(request.new_password)
        db.commit()
        return True

    @staticmethod
    def get_user_info(user: TbGuzhangModelUser) -> UserInfoResponse:
        return UserInfoResponse(
            id=user.id,
            username=user.username,
            nickname=user.nickname,
            avatar=user.avatar,
            total_games=user.total_games,
            total_wins=user.total_wins,
            highest_score=user.highest_score
        )

    @staticmethod
    def save_game_record(db: Session, user_id: int, player_score: float, opponent_score: float,
                         is_win: bool, duration: int, max_cheer: float, combo_count: int) -> TbGuzhangModelGameRecord:
        record = TbGuzhangModelGameRecord(
            user_id=user_id,
            player_score=player_score,
            opponent_score=opponent_score,
            is_win=is_win,
            duration=duration,
            max_cheer=max_cheer,
            combo_count=combo_count
        )
        db.add(record)

        user = db.query(TbGuzhangModelUser).filter(TbGuzhangModelUser.id == user_id).first()
        if user:
            user.total_games += 1
            if is_win:
                user.total_wins += 1
            if max_cheer > user.highest_score:
                user.highest_score = max_cheer

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_game_records(db: Session, user_id: int, limit: int = 10) -> list:
        records = db.query(TbGuzhangModelGameRecord).filter(
            TbGuzhangModelGameRecord.user_id == user_id
        ).order_by(TbGuzhangModelGameRecord.created_at.desc()).limit(limit).all()
        return records
