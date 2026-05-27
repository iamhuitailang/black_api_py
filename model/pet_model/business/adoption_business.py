from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from model.pet_model.models.adoption import AdoptionApplication, AdoptionFeedback, AdoptionAgreement
from model.pet_model.models.pet import Pet
from model.pet_model.models.user import User
from model.pet_model.schemas.adoption import (
    AdoptionApplicationCreate,
    AdoptionApplicationUpdate,
    AdoptionFeedbackCreate,
    AdoptionAgreementCreate,
    AdoptionAgreementUpdate,
)


def get_application(db: Session, application_id: int) -> Optional[AdoptionApplication]:
    return db.query(AdoptionApplication).filter(AdoptionApplication.id == application_id).first()


def get_application_detail(db: Session, application_id: int) -> Optional[Tuple[AdoptionApplication, Optional[Pet], Optional[User]]]:
    result = (
        db.query(AdoptionApplication, Pet, User)
        .outerjoin(Pet, AdoptionApplication.pet_id == Pet.id)
        .outerjoin(User, AdoptionApplication.applicant_id == User.id)
        .filter(AdoptionApplication.id == application_id)
        .first()
    )
    return result


def create_application(db: Session, application: AdoptionApplicationCreate, applicant_id: int) -> AdoptionApplication:
    db_application = AdoptionApplication(
        pet_id=application.pet_id,
        applicant_id=applicant_id,
        reason=application.reason,
        experience=application.experience,
        living_condition=application.living_condition,
        work_situation=application.work_situation,
        family_members=application.family_members,
        has_other_pets=application.has_other_pets,
        agreement=application.agreement,
        status="pending",
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


def update_application_status(
    db: Session, application_id: int, application_update: AdoptionApplicationUpdate
) -> Optional[AdoptionApplication]:
    db_application = get_application(db, application_id)
    if not db_application:
        return None
    if application_update.status:
        db_application.status = application_update.status
    if application_update.reject_reason:
        db_application.reject_reason = application_update.reject_reason
    db.commit()
    db.refresh(db_application)
    return db_application


def get_application_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    pet_id: Optional[int] = None,
    applicant_id: Optional[int] = None,
    status: Optional[str] = None,
) -> Tuple[List[AdoptionApplication], int]:
    query = db.query(AdoptionApplication)
    if pet_id:
        query = query.filter(AdoptionApplication.pet_id == pet_id)
    if applicant_id:
        query = query.filter(AdoptionApplication.applicant_id == applicant_id)
    if status:
        query = query.filter(AdoptionApplication.status == status)
    total = query.count()
    applications = query.order_by(AdoptionApplication.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return applications, total


def get_application_list_with_detail(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    pet_id: Optional[int] = None,
    applicant_id: Optional[int] = None,
    sender_id: Optional[int] = None,
    status: Optional[str] = None,
) -> Tuple[List[Tuple[AdoptionApplication, Pet, User]], int]:
    query = db.query(AdoptionApplication, Pet, User).join(Pet).join(User, AdoptionApplication.applicant_id == User.id)
    if pet_id:
        query = query.filter(AdoptionApplication.pet_id == pet_id)
    if applicant_id:
        query = query.filter(AdoptionApplication.applicant_id == applicant_id)
    if sender_id:
        query = query.filter(Pet.user_id == sender_id)
    if status:
        query = query.filter(AdoptionApplication.status == status)
    total = query.count()
    results = query.order_by(AdoptionApplication.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def create_feedback(db: Session, feedback: AdoptionFeedbackCreate, user_id: int) -> AdoptionFeedback:
    db_feedback = AdoptionFeedback(
        application_id=feedback.application_id,
        pet_id=feedback.pet_id,
        user_id=user_id,
        content=feedback.content,
        images=feedback.images,
        rating=feedback.rating,
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_feedback_list(db: Session, pet_id: Optional[int] = None, user_id: Optional[int] = None) -> List[AdoptionFeedback]:
    query = db.query(AdoptionFeedback)
    if pet_id:
        query = query.filter(AdoptionFeedback.pet_id == pet_id)
    if user_id:
        query = query.filter(AdoptionFeedback.user_id == user_id)
    return query.order_by(AdoptionFeedback.created_at.desc()).all()


def get_agreement(db: Session, agreement_id: Optional[int] = None) -> Optional[AdoptionAgreement]:
    if agreement_id:
        return db.query(AdoptionAgreement).filter(AdoptionAgreement.id == agreement_id).first()
    return db.query(AdoptionAgreement).filter(AdoptionAgreement.status == 1).order_by(AdoptionAgreement.created_at.desc()).first()


def create_agreement(db: Session, agreement: AdoptionAgreementCreate) -> AdoptionAgreement:
    db_agreement = AdoptionAgreement(
        title=agreement.title,
        content=agreement.content,
        version=agreement.version,
        status=agreement.status or 1,
    )
    db.add(db_agreement)
    db.commit()
    db.refresh(db_agreement)
    return db_agreement


def update_agreement(db: Session, agreement_id: int, agreement_update: AdoptionAgreementUpdate) -> Optional[AdoptionAgreement]:
    db_agreement = get_agreement(db, agreement_id)
    if not db_agreement:
        return None
    update_data = agreement_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_agreement, key, value)
    db.commit()
    db.refresh(db_agreement)
    return db_agreement


def get_agreement_list(db: Session, page: int = 1, page_size: int = 10) -> Tuple[List[AdoptionAgreement], int]:
    query = db.query(AdoptionAgreement)
    total = query.count()
    agreements = query.order_by(AdoptionAgreement.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return agreements, total


def delete_agreement(db: Session, agreement_id: int) -> bool:
    db_agreement = get_agreement(db, agreement_id)
    if not db_agreement:
        return False
    db.delete(db_agreement)
    db.commit()
    return True
