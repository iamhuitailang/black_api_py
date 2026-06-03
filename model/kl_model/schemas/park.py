from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ParkBase(BaseModel):
    name: str
    description: Optional[str] = ""
    theme: Optional[str] = "default"


class ParkCreate(ParkBase):
    pass


class ParkUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    safety_level: Optional[int] = None


class ParkResponse(ParkBase):
    id: int
    user_id: int
    level: int
    rating: float
    visitor_count: int
    income: float
    reputation: int
    safety_level: int
    park_size: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
