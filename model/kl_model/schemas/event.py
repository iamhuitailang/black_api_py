from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class EventBase(BaseModel):
    type: str
    title: str
    park_id: int
    description: Optional[str] = ""


class EventCreate(EventBase):
    severity: Optional[str] = "normal"
    dinosaur_id: Optional[int] = None
    habitat_id: Optional[int] = None
    reward_coins: Optional[int] = 0
    penalty_coins: Optional[int] = 0
    reputation_change: Optional[int] = 0


class EventUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    description: Optional[str] = None


class EventResponse(EventBase):
    id: int
    user_id: int
    severity: str
    dinosaur_id: Optional[int] = None
    habitat_id: Optional[int] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    reward_coins: int
    penalty_coins: int
    reputation_change: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventResolveRequest(BaseModel):
    event_id: int
    resolution: str
