from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class SubmarineBase(BaseModel):
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    max_depth: Optional[float] = 100.0
    speed: Optional[float] = 1.0
    capacity: Optional[int] = 10
    pressure_resistance: Optional[float] = 100.0
    durability: Optional[int] = 100
    price: Optional[int] = 0
    currency_type: Optional[str] = "coins"
    unlock_level: Optional[int] = 1
    is_default: Optional[int] = 0


class SubmarineCreate(SubmarineBase):
    pass


class SubmarineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    max_depth: Optional[float] = None
    speed: Optional[float] = None
    capacity: Optional[int] = None
    pressure_resistance: Optional[float] = None
    durability: Optional[int] = None
    price: Optional[int] = None
    currency_type: Optional[str] = None
    unlock_level: Optional[int] = None
    is_default: Optional[int] = None


class SubmarineResponse(SubmarineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
