from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class UserBase(BaseModel):
    username: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "user"
    address: Optional[str] = None
    description: Optional[str] = None


class UserCreate(UserBase):
    username: str
    password: str
    phone: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None
    status: Optional[int] = None


class UserResponse(UserBase):
    id: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    list: list[UserResponse]
    total: int
    page: int
    page_size: int
