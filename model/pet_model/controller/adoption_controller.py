from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from model.pet_model.core.database import get_db
from model.pet_model.core.response import success, error, page_result
from model.pet_model.schemas.adoption import (
    AdoptionApplicationCreate,
    AdoptionApplicationUpdate,
    AdoptionFeedbackCreate,
    AdoptionAgreementCreate,
    AdoptionAgreementUpdate,
    AdoptionApplicationDetailResponse,
)
from model.pet_model.business.adoption_business import (
    create_application,
    get_application,
    get_application_detail,
    get_application_list,
    get_application_list_with_detail,
    update_application_status,
    create_feedback,
    get_feedback_list,
    create_agreement,
    get_agreement,
    get_agreement_list,
    update_agreement,
    delete_agreement,
)

router = APIRouter(prefix="/adoption", tags=["领养管理"])


@router.post("/application/create", summary="提交领养申请")
def create_application_info(application: AdoptionApplicationCreate, applicant_id: int, db: Session = Depends(get_db)):
    db_application = create_application(db, application, applicant_id)
    return success(db_application, "申请提交成功")


@router.get("/application/detail/{application_id}", summary="获取领养申请详情")
def get_application_info(application_id: int, db: Session = Depends(get_db)):
    result = get_application_detail(db, application_id)
    if not result:
        return error("申请不存在")
    application, pet, applicant = result
    response = AdoptionApplicationDetailResponse(
        id=application.id,
        pet_id=application.pet_id,
        applicant_id=application.applicant_id,
        reason=application.reason,
        experience=application.experience,
        living_condition=application.living_condition,
        work_situation=application.work_situation,
        family_members=application.family_members,
        has_other_pets=application.has_other_pets,
        agreement=application.agreement,
        status=application.status,
        reject_reason=application.reject_reason,
        created_at=application.created_at,
        updated_at=application.updated_at,
        pet_name=pet.name if pet else None,
        pet_images=pet.images if pet else None,
        applicant_nickname=applicant.nickname if applicant else None,
        applicant_phone=applicant.phone if applicant else None,
    )
    return success(response)


@router.get("/application/list", summary="获取领养申请列表")
def get_applications(
    page: int = 1,
    page_size: int = 10,
    pet_id: Optional[int] = None,
    applicant_id: Optional[int] = None,
    sender_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if sender_id:
        results, total = get_application_list_with_detail(db, page, page_size, pet_id, applicant_id, sender_id, status)
        list_data = []
        for application, pet, applicant in results:
            list_data.append(
                AdoptionApplicationDetailResponse(
                    id=application.id,
                    pet_id=application.pet_id,
                    applicant_id=application.applicant_id,
                    reason=application.reason,
                    experience=application.experience,
                    living_condition=application.living_condition,
                    work_situation=application.work_situation,
                    family_members=application.family_members,
                    has_other_pets=application.has_other_pets,
                    agreement=application.agreement,
                    status=application.status,
                    reject_reason=application.reject_reason,
                    created_at=application.created_at,
                    updated_at=application.updated_at,
                    pet_name=pet.name if pet else None,
                    pet_images=pet.images if pet else None,
                    applicant_nickname=applicant.nickname if applicant else None,
                    applicant_phone=applicant.phone if applicant else None,
                )
            )
        return page_result(list_data, total, page, page_size)
    else:
        applications, total = get_application_list(db, page, page_size, pet_id, applicant_id, status)
        return page_result(applications, total, page, page_size)


@router.put("/application/status/{application_id}", summary="审核领养申请")
def update_application_status_info(
    application_id: int, application_update: AdoptionApplicationUpdate, db: Session = Depends(get_db)
):
    db_application = update_application_status(db, application_id, application_update)
    if not db_application:
        return error("申请不存在")
    return success(db_application, "审核完成")


@router.post("/feedback/create", summary="提交领养反馈")
def create_feedback_info(feedback: AdoptionFeedbackCreate, user_id: int, db: Session = Depends(get_db)):
    db_feedback = create_feedback(db, feedback, user_id)
    return success(db_feedback, "反馈提交成功")


@router.get("/feedback/list", summary="获取反馈列表")
def get_feedbacks(pet_id: Optional[int] = None, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    feedbacks = get_feedback_list(db, pet_id, user_id)
    return success(feedbacks)


@router.post("/agreement/create", summary="创建领养协议")
def create_agreement_info(agreement: AdoptionAgreementCreate, db: Session = Depends(get_db)):
    db_agreement = create_agreement(db, agreement)
    return success(db_agreement, "协议创建成功")


@router.get("/agreement/latest", summary="获取最新领养协议")
def get_latest_agreement(db: Session = Depends(get_db)):
    agreement = get_agreement(db)
    return success(agreement)


@router.get("/agreement/list", summary="获取协议列表")
def get_agreements(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    agreements, total = get_agreement_list(db, page, page_size)
    return page_result(agreements, total, page, page_size)


@router.put("/agreement/update/{agreement_id}", summary="更新协议")
def update_agreement_info(agreement_id: int, agreement_update: AdoptionAgreementUpdate, db: Session = Depends(get_db)):
    db_agreement = update_agreement(db, agreement_id, agreement_update)
    if not db_agreement:
        return error("协议不存在")
    return success(db_agreement, "更新成功")


@router.delete("/agreement/delete/{agreement_id}", summary="删除协议")
def delete_agreement_info(agreement_id: int, db: Session = Depends(get_db)):
    result = delete_agreement(db, agreement_id)
    if not result:
        return error("协议不存在")
    return success(None, "删除成功")
