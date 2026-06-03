from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class RuinBase(BaseModel):
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    depth: Optional[float] = 500.0
    difficulty: Optional[str] = "easy"
    treasure_reward: Optional[int] = 0
    exp_reward: Optional[int] = 100
    required_level: Optional[int] = 1
    is_discovered: Optional[int] = 0
    story: Optional[str] = ""


class RuinCreate(RuinBase):
    pass


class RuinUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    depth: Optional[float] = None
    difficulty: Optional[str] = None
    treasure_reward: Optional[int] = None
    exp_reward: Optional[int] = None
    required_level: Optional[int] = None
    is_discovered: Optional[int] = None
    story: Optional[str] = None


class RuinResponse(RuinBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
