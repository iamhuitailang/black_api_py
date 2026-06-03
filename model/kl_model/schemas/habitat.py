from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class HabitatBase(BaseModel):
    name: str
    type: str
    park_id: Optional[int] = None
    description: Optional[str] = ""


class HabitatCreate(HabitatBase):
    capacity: Optional[int] = 5
    cost: Optional[float] = 0.0
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0
    width: Optional[float] = 100.0
    height: Optional[float] = 100.0


class HabitatUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    level: Optional[int] = None
    security_level: Optional[int] = None
    comfort: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class HabitatResponse(HabitatBase):
    id: int
    user_id: int
    level: int
    capacity: int
    size: int
    security_level: int
    comfort: int
    is_active: bool
    position_x: float
    position_y: float
    width: float
    height: float
    dinosaur_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
