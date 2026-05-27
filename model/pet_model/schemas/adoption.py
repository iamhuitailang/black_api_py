from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AdoptionApplicationBase(BaseModel):
    pet_id: Optional[int] = None
    reason: Optional[str] = None
    experience: Optional[str] = None
    living_condition: Optional[str] = None
    work_situation: Optional[str] = None
    family_members: Optional[str] = None
    has_other_pets: Optional[int] = 0
    agreement: Optional[int] = 0


class AdoptionApplicationCreate(AdoptionApplicationBase):
    pet_id: int
    reason: str
    experience: str
    living_condition: str


class AdoptionApplicationUpdate(BaseModel):
    status: Optional[str] = None
    reject_reason: Optional[str] = None


class AdoptionApplicationResponse(AdoptionApplicationBase):
    id: int
    applicant_id: int
    status: str
    reject_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdoptionApplicationDetailResponse(AdoptionApplicationResponse):
    pet_name: Optional[str] = None
    pet_images: Optional[str] = None
    applicant_nickname: Optional[str] = None
    applicant_phone: Optional[str] = None


class AdoptionFeedbackBase(BaseModel):
    application_id: Optional[int] = None
    pet_id: Optional[int] = None
    content: Optional[str] = None
    images: Optional[str] = None
    rating: Optional[int] = None


class AdoptionFeedbackCreate(AdoptionFeedbackBase):
    application_id: int
    pet_id: int
    content: str
    rating: int


class AdoptionFeedbackResponse(AdoptionFeedbackBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdoptionAgreementBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    version: Optional[str] = None
    status: Optional[int] = 1


class AdoptionAgreementCreate(AdoptionAgreementBase):
    title: str
    content: str


class AdoptionAgreementUpdate(AdoptionAgreementBase):
    pass


class AdoptionAgreementResponse(AdoptionAgreementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
