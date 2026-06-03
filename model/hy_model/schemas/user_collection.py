from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class UserCollectionBase(BaseModel):
    user_id: int
    item_type: str
    item_id: int
    count: Optional[int] = 1


class UserCollectionCreate(UserCollectionBase):
    pass


class UserCollectionResponse(UserCollectionBase):
    id: int
    first_found_at: datetime
    last_found_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
