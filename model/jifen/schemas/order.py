from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderBase(BaseModel):
    product_id: int
    quantity: int = 1
    receiver_name: Optional[str] = ""
    receiver_phone: Optional[str] = ""
    receiver_address: Optional[str] = ""
    remark: Optional[str] = ""


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    express_no: Optional[str] = None
    express_company: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    product_id: int
    product_name: str
    product_image: str
    price: int
    quantity: int
    total_price: int
    status: str
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    express_no: str
    express_company: str
    remark: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    username: str
    product_id: int
    product_name: str
    product_image: str
    price: int
    quantity: int
    total_price: int
    status: str
    receiver_name: str
    receiver_phone: str
    express_no: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
