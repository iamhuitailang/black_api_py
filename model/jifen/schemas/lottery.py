from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LotteryCreate(BaseModel):
    product_id: int


class LotteryResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_name: str
    result: int
    result_description: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SigninResponse(BaseModel):
    id: int
    user_id: int
    signin_date: str
    continuous_days: int
    points: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SigninInfo(BaseModel):
    today_signed: bool
    continuous_days: int
    signin_points: list
    today_points: int
