from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.park import ParkCreate, ParkUpdate
from model.kl_model.business.park_business import ParkBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/parks", tags=["parks"])


@router.get("")
def read_my_parks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parks = ParkBusiness.get_parks_by_user(db, user_id=current_user.id)
    return success_response(data=parks)


@router.post("")
def create_park(
    park: ParkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_park = ParkBusiness.create_park(db, park=park, user_id=current_user.id)
    return success_response(data=db_park)


@router.get("/{park_id}")
def read_park(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_park = ParkBusiness.get_park(db, park_id=park_id)
    if db_park is None:
        return error_response(code=404, message="公园不存在")
    return success_response(data=db_park)


@router.put("/{park_id}")
def update_park(
    park_id: int,
    park_update: ParkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_park = ParkBusiness.update_park(db, park_id, park_update, user_id=current_user.id)
    if db_park is None:
        return error_response(code=404, message="公园不存在或无权限")
    return success_response(data=db_park)


@router.delete("/{park_id}")
def delete_park(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = ParkBusiness.delete_park(db, park_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="公园不存在或无权限")
    return success_response(message="删除成功")


@router.post("/{park_id}/visitor")
def add_visitor(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_park = ParkBusiness.add_visitor(db, park_id)
    if db_park is None:
        return error_response(code=404, message="公园不存在")
    return success_response(data=db_park)


@router.post("/{park_id}/rating")
def update_rating(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_park = ParkBusiness.update_rating(db, park_id)
    if db_park is None:
        return error_response(code=404, message="公园不存在")
    return success_response(data=db_park)
