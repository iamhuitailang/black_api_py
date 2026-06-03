from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.dinosaur import DinosaurCreate, DinosaurUpdate, DinosaurCloneRequest, DinosaurFeedRequest
from model.kl_model.business.dinosaur_business import DinosaurBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User, DinosaurSpecies

router = APIRouter(prefix="/dinosaurs", tags=["dinosaurs"])


@router.get("/species")
def read_dinosaur_species(
    db: Session = Depends(get_db)
):
    species = db.query(DinosaurSpecies).all()
    return success_response(data=species)


@router.get("")
def read_my_dinosaurs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaurs = DinosaurBusiness.get_dinosaurs_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=dinosaurs)


@router.get("/park/{park_id}")
def read_park_dinosaurs(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaurs = DinosaurBusiness.get_dinosaurs_by_park(db, park_id=park_id)
    return success_response(data=dinosaurs)


@router.get("/habitat/{habitat_id}")
def read_habitat_dinosaurs(
    habitat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaurs = DinosaurBusiness.get_dinosaurs_by_habitat(db, habitat_id=habitat_id)
    return success_response(data=dinosaurs)


@router.post("/clone")
def clone_dinosaur(
    request: DinosaurCloneRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaur, message, cost, exp_gain = DinosaurBusiness.clone_dinosaur(db, request=request, user_id=current_user.id)
    if not dinosaur:
        return error_response(code=400, message=message)
    
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    UserBusiness.add_experience(db, current_user.id, exp_gain)
    
    return success_response(data={"dinosaur": dinosaur, "cost": cost, "exp_gain": exp_gain}, message=message)


@router.post("/feed")
def feed_dinosaur(
    request: DinosaurFeedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaur, message, cost = DinosaurBusiness.feed_dinosaur(db, dinosaur_id=request.dinosaur_id, user_id=current_user.id)
    if not dinosaur:
        return error_response(code=400, message=message)
    
    if current_user.coins < cost:
        return error_response(code=400, message="金币不足")
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost)
    
    return success_response(data={"dinosaur": dinosaur, "cost": cost}, message=message)


@router.post("/{dinosaur_id}/status")
def update_dinosaur_status(
    dinosaur_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaur = DinosaurBusiness.update_dinosaur_status(db, dinosaur_id=dinosaur_id, user_id=current_user.id)
    if not dinosaur:
        return error_response(code=404, message="恐龙不存在或无权限")
    return success_response(data=dinosaur)


@router.get("/{dinosaur_id}")
def read_dinosaur(
    dinosaur_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_dinosaur = DinosaurBusiness.get_dinosaur(db, dinosaur_id=dinosaur_id)
    if db_dinosaur is None or db_dinosaur.user_id != current_user.id:
        return error_response(code=404, message="恐龙不存在")
    return success_response(data=db_dinosaur)


@router.post("")
def create_dinosaur(
    dinosaur: DinosaurCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_dinosaur = DinosaurBusiness.create_dinosaur(db, dinosaur=dinosaur, user_id=current_user.id)
    return success_response(data=db_dinosaur)


@router.put("/{dinosaur_id}")
def update_dinosaur(
    dinosaur_id: int,
    dinosaur_update: DinosaurUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_dinosaur = DinosaurBusiness.update_dinosaur(db, dinosaur_id, dinosaur_update, user_id=current_user.id)
    if db_dinosaur is None:
        return error_response(code=404, message="恐龙不存在或无权限")
    return success_response(data=db_dinosaur)


@router.delete("/{dinosaur_id}")
def delete_dinosaur(
    dinosaur_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = DinosaurBusiness.delete_dinosaur(db, dinosaur_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="恐龙不存在或无权限")
    return success_response(message="删除成功")
