from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class CreatureBase(BaseModel):
    name: str
    scientific_name: Optional[str] = ""
    description: Optional[str] = ""
    image: Optional[str] = ""
    rarity: Optional[str] = "common"
    category: Optional[str] = "fish"
    min_depth: Optional[float] = 0.0
    max_depth: Optional[float] = 1000.0
    coins_value: Optional[int] = 10
    exp_value: Optional[int] = 5
    is_dangerous: Optional[int] = 0
    damage: Optional[int] = 0
    speed: Optional[float] = 1.0
    behavior: Optional[str] = "passive"


class CreatureCreate(CreatureBase):
    pass


class CreatureUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    rarity: Optional[str] = None
    category: Optional[str] = None
    min_depth: Optional[float] = None
    max_depth: Optional[float] = None
    coins_value: Optional[int] = None
    exp_value: Optional[int] = None
    is_dangerous: Optional[int] = None
    damage: Optional[int] = None
    speed: Optional[float] = None
    behavior: Optional[str] = None


class CreatureResponse(CreatureBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
