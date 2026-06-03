from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')


class ResponseModel(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    level: int
    exp: int
    coins: int
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True


class GhostTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: int = 1
    weakness: Optional[str] = None
    evidence_required: int = 3
    behavior: Optional[str] = None


class GhostTypeResponse(GhostTypeBase):
    id: int

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: int = 1
    is_night: bool = False
    ghost_count: int = 1
    unlocked_level: int = 1


class LocationResponse(LocationBase):
    id: int

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    level: int = 1
    max_level: int = 5
    power: int = 10
    price: int = 50
    upgrade_cost: int = 100
    effect: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    id: int

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    location_id: int
    ghost_type_id: int
    reward_coins: int = 50
    reward_exp: int = 20
    difficulty: int = 1
    story: Optional[str] = None


class TaskResponse(TaskBase):
    id: int

    class Config:
        from_attributes = True


class EvidenceTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class EvidenceTypeResponse(EvidenceTypeBase):
    id: int

    class Config:
        from_attributes = True


class UserGameStateBase(BaseModel):
    user_id: int
    current_location_id: Optional[int] = None
    current_task_id: Optional[int] = None
    is_exploring: bool = False
    ghost_found: bool = False
    evidence_collected: int = 0
    sanity: int = 100
    game_time: str = "day"


class UserGameStateResponse(UserGameStateBase):
    id: int

    class Config:
        from_attributes = True


class UserTaskBase(BaseModel):
    user_id: int
    task_id: int
    status: str = "pending"
    progress: int = 0
    ghost_identified: Optional[str] = None


class UserTaskResponse(UserTaskBase):
    id: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserEvidenceBase(BaseModel):
    user_id: int
    evidence_type_id: int
    location_id: int
    task_id: int
    notes: Optional[str] = None


class UserEvidenceResponse(UserEvidenceBase):
    id: int
    collected_at: datetime

    class Config:
        from_attributes = True


class UserInventoryBase(BaseModel):
    user_id: int
    equipment_id: int
    level: int = 1
    is_equipped: bool = False


class UserInventoryResponse(UserInventoryBase):
    id: int

    class Config:
        from_attributes = True


class GhostArchiveBase(BaseModel):
    ghost_type_id: int
    user_id: int
    discovered: bool = False
    encounters: int = 0
    defeated: int = 0
    story_unlocked: Optional[str] = None


class GhostArchiveResponse(GhostArchiveBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ExploreRequest(BaseModel):
    location_id: int
    task_id: int = None


class EvidenceCollectRequest(BaseModel):
    evidence_type_id: int
    location_id: int
    task_id: int
    notes: Optional[str] = None


class ExorcismRequest(BaseModel):
    task_id: int
    ghost_type_id: int


class UpgradeEquipmentRequest(BaseModel):
    inventory_id: int
