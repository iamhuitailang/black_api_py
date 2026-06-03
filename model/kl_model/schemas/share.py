from typing import Optional
from datetime import datetime
from pydantic import BaseModel, model_validator


class ShareBase(BaseModel):
    share_type: str
    title: str
    content: Optional[str] = ""

    @model_validator(mode='before')
    @classmethod
    def map_type_field(cls, data):
        if isinstance(data, dict):
            if 'type' in data and 'share_type' not in data:
                data['share_type'] = data.pop('type')
        return data


class ShareCreate(ShareBase):
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    visibility: Optional[str] = "public"


class ShareUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    visibility: Optional[str] = None


class ShareResponse(ShareBase):
    id: int
    user_id: int
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    likes: int
    comments: int
    shares: int
    visibility: str
    username: Optional[str] = None
    user_avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ShareInteractionCreate(BaseModel):
    share_id: int
    interaction_type: Optional[str] = None
    comment: Optional[str] = ""

    @model_validator(mode='before')
    @classmethod
    def map_type_field(cls, data):
        if isinstance(data, dict):
            if 'type' in data and 'interaction_type' not in data:
                data['interaction_type'] = data.pop('type')
        return data


class ShareInteractionResponse(BaseModel):
    id: int
    share_id: int
    user_id: int
    interaction_type: str
    comment: str
    username: Optional[str] = None
    user_avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
