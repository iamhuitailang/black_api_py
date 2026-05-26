from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    nickname: Optional[str] = ""
    avatar: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""


class UserCreate(UserBase):
    password: str
    invite_code: Optional[str] = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class UserPointsUpdate(BaseModel):
    points: int


class UserResponse(UserBase):
    id: int
    points: int
    total_points: int
    role: str
    profile_completed: bool
    invite_code: str
    invited_by: int
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    points: int
    total_points: int
    role: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserRankResponse(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    points: int
    total_points: int
    rank: int

    class Config:
        from_attributes = True
