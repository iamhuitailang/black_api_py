from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class GeneModificationBase(BaseModel):
    name: str
    code: str
    type: str
    description: Optional[str] = ""


class GeneModificationCreate(GeneModificationBase):
    effect_aggression: Optional[int] = 0
    effect_intelligence: Optional[int] = 0
    effect_speed: Optional[int] = 0
    effect_health: Optional[int] = 0
    effect_size: Optional[float] = 0.0
    rarity: Optional[str] = "common"
    cost_coins: Optional[float] = 0.0
    cost_diamonds: Optional[float] = 0.0
    success_rate: Optional[float] = 0.7
    unlock_level: Optional[int] = 1


class GeneModificationResponse(GeneModificationBase):
    id: int
    effect_aggression: int
    effect_intelligence: int
    effect_speed: int
    effect_health: int
    effect_size: float
    rarity: str
    cost_coins: float
    cost_diamonds: float
    success_rate: float
    is_unlockable: bool
    unlock_level: int
    created_at: datetime

    class Config:
        from_attributes = True


class GeneModificationApplyRequest(BaseModel):
    dinosaur_id: int
    gene_modification_id: int
