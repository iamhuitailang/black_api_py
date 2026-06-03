from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class FossilBase(BaseModel):
    species_id: int
    location: Optional[str] = ""


class FossilCreate(FossilBase):
    pass


class FossilUpdate(BaseModel):
    quality: Optional[int] = None
    is_complete: Optional[bool] = None
    fragments: Optional[int] = None


class FossilResponse(FossilBase):
    id: int
    user_id: int
    quality: int
    is_complete: bool
    fragments: int
    fragments_needed: int
    discovered_at: datetime
    species_name: Optional[str] = None

    class Config:
        from_attributes = True


class FossilExcavateRequest(BaseModel):
    location: Optional[str] = "default"
    difficulty: Optional[str] = "normal"
    cost: Optional[float] = 0.0


class FossilCombineRequest(BaseModel):
    fossil_ids: list[int]
