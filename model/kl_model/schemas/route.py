from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel


class RouteBase(BaseModel):
    name: str
    park_id: int
    description: Optional[str] = ""


class RouteCreate(RouteBase):
    waypoints: Optional[List[Any]] = []
    duration: Optional[int] = 60


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    waypoints: Optional[List[Any]] = None
    duration: Optional[int] = None
    is_active: Optional[bool] = None


class RouteResponse(RouteBase):
    id: int
    user_id: int
    waypoints: str
    duration: int
    popularity: int
    safety_rating: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
