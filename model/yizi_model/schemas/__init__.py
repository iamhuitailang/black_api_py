from pydantic import BaseModel
from typing import Generic, TypeVar, Optional
from datetime import datetime

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    nickname: Optional[str] = None


class UserLogin(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    nickname: str
    win_count: int
    lose_count: int
    total_games: int
    created_at: datetime

    class Config:
        from_attributes = True


class GameRecordBase(BaseModel):
    player_id: int
    enemy_type: str
    result: str
    player_hp_remaining: int
    enemy_hp_remaining: int
    duration: int


class GameRecordCreate(GameRecordBase):
    pass


class GameRecordResponse(GameRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    user_id: int
    username: str
