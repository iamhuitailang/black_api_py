from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class PetBase(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    type: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    vaccinated: Optional[int] = 0
    sterilized: Optional[int] = 0
    dewormed: Optional[int] = 0
    description: Optional[str] = None
    images: Optional[str] = None
    address: Optional[str] = None


class PetCreate(PetBase):
    name: str
    breed: str
    type: str


class PetUpdate(PetBase):
    status: Optional[str] = None


class PetResponse(PetBase):
    id: int
    status: str
    user_id: int
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PetDetailResponse(PetResponse):
    owner_nickname: Optional[str] = None
    owner_avatar: Optional[str] = None


class PetListResponse(BaseModel):
    list: list[PetResponse]
    total: int
    page: int
    page_size: int
