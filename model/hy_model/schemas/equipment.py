from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class EquipmentBase(BaseModel):
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    type: Optional[str] = "pressure"
    rarity: Optional[str] = "common"
    level: Optional[int] = 1
    effect_type: Optional[str] = "pressure_resistance"
    effect_value: Optional[float] = 10.0
    price: Optional[int] = 100
    currency_type: Optional[str] = "coins"
    unlock_level: Optional[int] = 1
    upgrade_cost: Optional[int] = 50
    max_level: Optional[int] = 10


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    type: Optional[str] = None
    rarity: Optional[str] = None
    level: Optional[int] = None
    effect_type: Optional[str] = None
    effect_value: Optional[float] = None
    price: Optional[int] = None
    currency_type: Optional[str] = None
    unlock_level: Optional[int] = None
    upgrade_cost: Optional[int] = None
    max_level: Optional[int] = None


class EquipmentResponse(EquipmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
