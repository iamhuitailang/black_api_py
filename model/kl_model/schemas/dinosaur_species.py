from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class DinosaurSpeciesBase(BaseModel):
    name: str
    type: str
    era: str
    diet: str
    height: float
    length: float
    weight: float
    habitat_type: str
    description: Optional[str] = ""
    image: Optional[str] = ""


class DinosaurSpeciesCreate(DinosaurSpeciesBase):
    aggression: Optional[int] = 50
    intelligence: Optional[int] = 50
    speed: Optional[int] = 50
    rarity: Optional[str] = "common"
    fossil_cost: Optional[int] = 100
    clone_cost: Optional[float] = 1000.0


class DinosaurSpeciesResponse(DinosaurSpeciesBase):
    id: int
    aggression: int
    intelligence: int
    speed: int
    rarity: str
    fossil_cost: int
    clone_cost: float
    created_at: datetime

    class Config:
        from_attributes = True
