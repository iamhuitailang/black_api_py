from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TreasureBase(BaseModel):
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    rarity: Optional[str] = "common"
    category: Optional[str] = "coin"
    min_depth: Optional[float] = 0.0
    max_depth: Optional[float] = 1000.0
    coins_value: Optional[int] = 10
    gems_value: Optional[int] = 0
    exp_value: Optional[int] = 5
    weight: Optional[float] = 1.0


class TreasureCreate(TreasureBase):
    pass


class TreasureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    rarity: Optional[str] = None
    category: Optional[str] = None
    min_depth: Optional[float] = None
    max_depth: Optional[float] = None
    coins_value: Optional[int] = None
    gems_value: Optional[int] = None
    exp_value: Optional[int] = None
    weight: Optional[float] = None


class TreasureResponse(TreasureBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
