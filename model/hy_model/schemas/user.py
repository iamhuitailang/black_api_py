from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nickname: Optional[str] = "深海探险者"
    avatar: Optional[str] = ""


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=50)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    level: Optional[int] = None
    experience: Optional[int] = None
    coins: Optional[int] = None
    gems: Optional[int] = None
    max_depth: Optional[float] = None
    current_submarine_id: Optional[int] = None
    pressure_resistance: Optional[float] = None


class UserResponse(UserBase):
    id: int
    level: int
    experience: int
    coins: int
    gems: int
    max_depth: float
    current_submarine_id: int
    pressure_resistance: float
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    user: UserResponse
    token: str
