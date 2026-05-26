from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class ResponseModel(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


def success_response(data=None, message: str = "success"):
    return ResponseModel(code=200, message=message, data=data)


def error_response(message: str = "error", code: int = 400):
    return ResponseModel(code=code, message=message, data=None)


class UserBase(BaseModel):
    username: str
    nickname: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    role: str
    status: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    total: int
    items: List[UserResponse]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CampingPlanBase(BaseModel):
    title: str
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_template: Optional[bool] = False


class CampingPlanCreate(CampingPlanBase):
    items: Optional[List[dict]] = None


class CampingPlanUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[int] = None


class PlanItemCreate(BaseModel):
    plan_id: int
    name: str
    category: Optional[str] = None
    quantity: Optional[int] = 1


class PlanItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    is_checked: Optional[bool] = None


class EquipmentBase(BaseModel):
    name: str
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    weight: Optional[float] = None
    price: Optional[float] = None
    purchase_date: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = "good"
    is_public: Optional[bool] = False


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    weight: Optional[float] = None
    price: Optional[float] = None
    purchase_date: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    is_public: Optional[bool] = None


class CampsiteBase(BaseModel):
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[str] = None
    facilities: Optional[str] = None
    best_season: Optional[str] = None
    difficulty: Optional[str] = None
    price_info: Optional[str] = None
    tips: Optional[str] = None


class CampsiteCreate(CampsiteBase):
    pass


class CampsiteUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[str] = None
    facilities: Optional[str] = None
    best_season: Optional[str] = None
    difficulty: Optional[str] = None
    price_info: Optional[str] = None
    tips: Optional[str] = None
    status: Optional[int] = None


class ReviewCreate(BaseModel):
    campsite_id: int
    rating: int = 5
    content: Optional[str] = None
    images: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    content: Optional[str] = None
    images: Optional[str] = None


class PostBase(BaseModel):
    title: str
    content: Optional[str] = None
    images: Optional[str] = None
    location: Optional[str] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    images: Optional[str] = None
    location: Optional[str] = None


class CommentCreate(BaseModel):
    post_id: int
    content: str
    parent_id: Optional[int] = None


class LikeCreate(BaseModel):
    post_id: int


class FollowCreate(BaseModel):
    following_id: int


class FavoriteCreate(BaseModel):
    campsite_id: int


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 10


class AdminStatistics(BaseModel):
    user_count: int = 0
    plan_count: int = 0
    equipment_count: int = 0
    campsite_count: int = 0
    post_count: int = 0
    recent_users: List[dict] = []
    recent_posts: List[dict] = []
