from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class FacilityBase(BaseModel):
    name: str
    type: str
    park_id: Optional[int] = None
    description: Optional[str] = ""


class FacilityCreate(FacilityBase):
    cost: Optional[float] = 0.0
    position_x: Optional[float] = 0.0
    position_y: Optional[float] = 0.0
    width: Optional[float] = 50.0
    height: Optional[float] = 50.0


class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class FacilityResponse(FacilityBase):
    id: int
    user_id: int
    level: int
    capacity: int
    income_per_hour: float
    cost: float
    is_active: bool
    position_x: float
    position_y: float
    width: float
    height: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
