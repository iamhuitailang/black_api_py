from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.facility import FacilityCreate, FacilityUpdate
from model.kl_model.business.facility_business import FacilityBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.get("")
def read_my_facilities(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    facilities = FacilityBusiness.get_facilities_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=facilities)


@router.get("/park/{park_id}")
def read_park_facilities(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    facilities = FacilityBusiness.get_facilities_by_park(db, park_id=park_id)
    return success_response(data=facilities)


@router.post("")
def create_facility(
    facility: FacilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.coins < facility.cost:
        return error_response(code=400, message="金币不足")
    
    db_facility = FacilityBusiness.create_facility(db, facility=facility, user_id=current_user.id)
    UserBusiness.update_balance(db, current_user.id, coins=-facility.cost)
    UserBusiness.add_experience(db, current_user.id, 30)
    
    return success_response(data=db_facility, message="设施建造成功")


@router.post("/{facility_id}/upgrade")
def upgrade_facility(
    facility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    facility, cost = FacilityBusiness.upgrade_facility(db, facility_id=facility_id, user_id=current_user.id)
    if not facility:
        return error_response(code=404, message="设施不存在或无权限")
    
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    UserBusiness.add_experience(db, current_user.id, 50)
    
    return success_response(data={"facility": facility, "cost": cost}, message="升级成功")


@router.post("/{facility_id}/collect")
def collect_income(
    facility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    facility, income = FacilityBusiness.collect_income(db, facility_id=facility_id, user_id=current_user.id)
    if not facility:
        return error_response(code=404, message="设施不存在或无权限")
    
    UserBusiness.update_balance(db, current_user.id, coins=income)
    
    return success_response(data={"facility": facility, "income": income}, message=f"收集收入 {income} 金币")


@router.get("/{facility_id}")
def read_facility(
    facility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_facility = FacilityBusiness.get_facility(db, facility_id=facility_id)
    if db_facility is None or db_facility.user_id != current_user.id:
        return error_response(code=404, message="设施不存在")
    return success_response(data=db_facility)


@router.put("/{facility_id}")
def update_facility(
    facility_id: int,
    facility_update: FacilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_facility = FacilityBusiness.update_facility(db, facility_id, facility_update, user_id=current_user.id)
    if db_facility is None:
        return error_response(code=404, message="设施不存在或无权限")
    return success_response(data=db_facility)


@router.delete("/{facility_id}")
def delete_facility(
    facility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = FacilityBusiness.delete_facility(db, facility_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="设施不存在或无权限")
    return success_response(message="删除成功")
