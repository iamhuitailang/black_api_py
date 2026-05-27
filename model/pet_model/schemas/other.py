from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class FavoriteCreate(BaseModel):
    pet_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    pet_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteDetailResponse(FavoriteResponse):
    pet_name: Optional[str] = None
    pet_images: Optional[str] = None
    pet_status: Optional[str] = None


class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    type: Optional[str] = "text"


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    type: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True


class MessageDetailResponse(MessageResponse):
    sender_nickname: Optional[str] = None
    sender_avatar: Optional[str] = None


class ReviewCreate(BaseModel):
    pet_id: int
    content: str
    rating: int
    images: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    pet_id: int
    user_id: int
    content: str
    rating: int
    images: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewDetailResponse(ReviewResponse):
    user_nickname: Optional[str] = None
    user_avatar: Optional[str] = None


class QuestionCreate(BaseModel):
    title: str
    content: str
    images: Optional[str] = None


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    images: Optional[str] = None
    status: Optional[int] = None


class QuestionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    images: Optional[str] = None
    view_count: int
    status: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionDetailResponse(QuestionResponse):
    user_nickname: Optional[str] = None
    user_avatar: Optional[str] = None
    answer_count: Optional[int] = 0


class AnswerCreate(BaseModel):
    question_id: int
    content: str
    images: Optional[str] = None


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    user_id: int
    content: str
    images: Optional[str] = None
    like_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerDetailResponse(AnswerResponse):
    user_nickname: Optional[str] = None
    user_avatar: Optional[str] = None


class ArticleCreate(BaseModel):
    title: str
    content: str
    cover: Optional[str] = None
    category: str


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    cover: Optional[str] = None
    category: Optional[str] = None
    status: Optional[int] = None


class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    cover: Optional[str] = None
    category: str
    view_count: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoticeCreate(BaseModel):
    title: str
    content: str
    type: Optional[str] = "system"


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    status: Optional[int] = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    type: str
    status: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    target_type: str
    target_id: int
    reason: str
    description: Optional[str] = None
    images: Optional[str] = None


class ReportUpdate(BaseModel):
    status: Optional[str] = None
    handle_result: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    description: Optional[str] = None
    images: Optional[str] = None
    status: str
    handle_result: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
