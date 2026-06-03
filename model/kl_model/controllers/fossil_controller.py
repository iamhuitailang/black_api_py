from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.fossil import FossilCreate, FossilUpdate, FossilExcavateRequest, FossilCombineRequest
from model.kl_model.business.fossil_business import FossilBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/fossils", tags=["fossils"])


@router.get("")
def read_my_fossils(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fossils = FossilBusiness.get_fossils_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=fossils)


@router.get("/complete")
def read_complete_fossils(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fossils = FossilBusiness.get_complete_fossils_by_user(db, user_id=current_user.id)
    return success_response(data=fossils)


@router.post("/excavate")
def excavate_fossil(
    request: FossilExcavateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cost = request.cost if request.cost and request.cost > 0 else 100.0
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    fossil, message, exp_gain = FossilBusiness.excavate_fossil(db, request=request, user_id=current_user.id)
    if not fossil:
        return error_response(code=400, message=message)
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    UserBusiness.add_experience(db, current_user.id, exp_gain)
    
    return success_response(data={"fossil": fossil, "exp_gain": exp_gain}, message=message)


@router.post("/combine")
def combine_fossils(
    request_data: FossilCombineRequest | list = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if isinstance(request_data, list):
        fossil_ids = request_data
    else:
        fossil_ids = request_data.fossil_ids
    
    fossil, message = FossilBusiness.combine_fossils(db, fossil_ids=fossil_ids, user_id=current_user.id)
    if not fossil:
        return error_response(code=400, message=message)
    return success_response(data=fossil, message=message)


@router.get("/{fossil_id}")
def read_fossil(
    fossil_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_fossil = FossilBusiness.get_fossil(db, fossil_id=fossil_id)
    if db_fossil is None or db_fossil.user_id != current_user.id:
        return error_response(code=404, message="化石不存在")
    return success_response(data=db_fossil)


@router.put("/{fossil_id}")
def update_fossil(
    fossil_id: int,
    fossil_update: FossilUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_fossil = FossilBusiness.update_fossil(db, fossil_id, fossil_update, user_id=current_user.id)
    if db_fossil is None:
        return error_response(code=404, message="化石不存在或无权限")
    return success_response(data=db_fossil)


@router.delete("/{fossil_id}")
def delete_fossil(
    fossil_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = FossilBusiness.delete_fossil(db, fossil_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="化石不存在或无权限")
    return success_response(message="删除成功")
