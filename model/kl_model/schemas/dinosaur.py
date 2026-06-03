from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class DinosaurBase(BaseModel):
    name: str
    species_id: int
    park_id: Optional[int] = None
    habitat_id: Optional[int] = None


class DinosaurCreate(DinosaurBase):
    gender: Optional[str] = "unknown"


class DinosaurUpdate(BaseModel):
    name: Optional[str] = None
    habitat_id: Optional[int] = None
    health: Optional[int] = None
    hunger: Optional[int] = None
    happiness: Optional[int] = None
    energy: Optional[int] = None
    behavior: Optional[str] = None


class DinosaurResponse(DinosaurBase):
    id: int
    user_id: int
    gender: str
    age: int
    health: int
    hunger: int
    happiness: int
    energy: int
    is_genetically_modified: bool
    aggression: int
    intelligence: int
    speed: int
    status: str
    behavior: str
    species_name: Optional[str] = None
    habitat_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DinosaurCloneRequest(BaseModel):
    fossil_id: Optional[int] = None
    species_id: Optional[int] = None
    name: str
    park_id: Optional[int] = None
    habitat_id: Optional[int] = None


class DinosaurFeedRequest(BaseModel):
    dinosaur_id: int
