from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PointsRecordResponse(BaseModel):
    id: int
    user_id: int
    points: int
    type: str
    description: str
    balance_after: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PointsSummary(BaseModel):
    total_points: int
    current_points: int
    today_points: int
    month_points: int
