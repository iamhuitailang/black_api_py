from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.habitat import HabitatCreate, HabitatUpdate, HabitatResponse
from model.kl_model.business.habitat_business import HabitatBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/habitats", tags=["habitats"])


@router.get("")
def read_my_habitats(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habitats = HabitatBusiness.get_habitats_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=habitats)


@router.get("/park/{park_id}")
def read_park_habitats(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habitats = HabitatBusiness.get_habitats_by_park(db, park_id=park_id)
    return success_response(data=habitats)


@router.post("")
def create_habitat(
    habitat: HabitatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cost = habitat.cost if habitat.cost and habitat.cost > 0 else 2000.0
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    db_habitat = HabitatBusiness.create_habitat(db, habitat=habitat, user_id=current_user.id)
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    UserBusiness.add_experience(db, current_user.id, 50)
    
    return success_response(data=db_habitat, message="栖息地建造成功")


@router.post("/{habitat_id}/upgrade")
def upgrade_habitat(
    habitat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habitat, cost = HabitatBusiness.upgrade_habitat(db, habitat_id=habitat_id, user_id=current_user.id)
    if not habitat:
        return error_response(code=404, message="栖息地不存在或无权限")
    
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    UserBusiness.add_experience(db, current_user.id, 100)
    
    return success_response(data={"habitat": habitat, "cost": cost}, message="升级成功")


@router.get("/{habitat_id}")
def read_habitat(
    habitat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_habitat = HabitatBusiness.get_habitat(db, habitat_id=habitat_id)
    if db_habitat is None or db_habitat.user_id != current_user.id:
        return error_response(code=404, message="栖息地不存在")
    
    dinosaur_count = HabitatBusiness.get_dinosaur_count(db, habitat_id=habitat_id)
    response_data = HabitatResponse.model_validate(db_habitat)
    response_data.dinosaur_count = dinosaur_count
    
    return success_response(data=response_data)


@router.put("/{habitat_id}")
def update_habitat(
    habitat_id: int,
    habitat_update: HabitatUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_habitat = HabitatBusiness.update_habitat(db, habitat_id, habitat_update, user_id=current_user.id)
    if db_habitat is None:
        return error_response(code=404, message="栖息地不存在或无权限")
    return success_response(data=db_habitat)


@router.delete("/{habitat_id}")
def delete_habitat(
    habitat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = HabitatBusiness.delete_habitat(db, habitat_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="栖息地不存在或无权限")
    return success_response(message="删除成功")
