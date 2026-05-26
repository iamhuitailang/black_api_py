from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskBase(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = ""
    points: int = 0
    type: str = "daily"
    limit_count: int = 1
    limit_period: str = "day"
    is_active: bool = True
    sort: int = 0


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    points: Optional[int] = None
    type: Optional[str] = None
    limit_count: Optional[int] = None
    limit_period: Optional[str] = None
    is_active: Optional[bool] = None
    sort: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserTaskResponse(BaseModel):
    id: int
    user_id: int
    task_id: int
    task_name: str
    task_icon: str
    task_description: str
    task_points: int
    task_type: str
    completed_count: int
    limit_count: int
    can_complete: bool
    last_completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
