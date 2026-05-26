from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AddressBase(BaseModel):
    receiver_name: str
    phone: str
    province: Optional[str] = ""
    city: Optional[str] = ""
    district: Optional[str] = ""
    detail: str
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    receiver_name: Optional[str] = None
    phone: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    detail: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
