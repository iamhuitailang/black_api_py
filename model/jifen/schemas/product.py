from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    images: Optional[str] = ""
    price: int = 0
    original_price: int = 0
    stock: int = 0
    total_stock: int = 0
    is_hot: bool = False
    is_online: bool = True
    is_virtual: bool = True
    limit_type: str = "none"
    limit_count: int = 0
    sort: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    images: Optional[str] = None
    price: Optional[int] = None
    original_price: Optional[int] = None
    stock: Optional[int] = None
    total_stock: Optional[int] = None
    is_hot: Optional[bool] = None
    is_online: Optional[bool] = None
    is_virtual: Optional[bool] = None
    limit_type: Optional[str] = None
    limit_count: Optional[int] = None
    sort: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    exchange_count: int = 0
    category_name: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    category_id: int
    category_name: str
    name: str
    image: str
    price: int
    original_price: int
    stock: int
    is_hot: bool
    is_online: bool
    is_virtual: bool
    exchange_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
