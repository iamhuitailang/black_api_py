from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class FriendBase(BaseModel):
    friend_id: int


class FriendCreate(FriendBase):
    pass


class FriendUpdate(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None


class FriendResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    friendship_level: int
    interaction_count: int
    friend_username: Optional[str] = None
    friend_avatar: Optional[str] = None
    friend_level: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FriendInviteCreate(BaseModel):
    invitee_email: EmailStr
    message: Optional[str] = ""


class FriendInviteResponse(BaseModel):
    id: int
    inviter_id: int
    invitee_email: str
    invite_code: str
    message: str
    is_accepted: bool
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class FriendInviteAccept(BaseModel):
    invite_code: str


class FriendInteractionRequest(BaseModel):
    friend_id: int
    interaction_type: str
    message: Optional[str] = ""
