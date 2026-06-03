from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MusicBase(BaseModel):
    name: str
    description: Optional[str] = ""
    file_path: Optional[str] = ""
    genre: Optional[str] = "ambient"
    bpm: Optional[int] = 100
    mood: Optional[str] = "calm"
    duration: Optional[int] = 180
    unlock_level: Optional[int] = 1
    price: Optional[int] = 0
    currency_type: Optional[str] = "coins"
    is_default: Optional[int] = 0


class MusicCreate(MusicBase):
    pass


class MusicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    genre: Optional[str] = None
    bpm: Optional[int] = None
    mood: Optional[str] = None
    duration: Optional[int] = None
    unlock_level: Optional[int] = None
    price: Optional[int] = None
    currency_type: Optional[str] = None
    is_default: Optional[int] = None


class MusicResponse(MusicBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
