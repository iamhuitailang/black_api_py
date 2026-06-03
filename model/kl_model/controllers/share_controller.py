from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.share import ShareCreate, ShareUpdate, ShareInteractionCreate
from model.kl_model.business.share_business import ShareBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/shares", tags=["shares"])


@router.get("")
def read_my_shares(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = ShareBusiness.get_shares_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=shares)


@router.get("/public")
def read_public_shares(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    shares = ShareBusiness.get_public_shares(db, skip=skip, limit=limit)
    return success_response(data=shares)


@router.post("")
def create_share(
    share: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_share = ShareBusiness.create_share(db, share=share, user_id=current_user.id)
    UserBusiness.add_experience(db, current_user.id, 20)
    return success_response(data=db_share, message="分享成功")


@router.post("/interact")
def add_interaction(
    interaction: ShareInteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_interaction, exp_gain = ShareBusiness.add_interaction(db, interaction=interaction, user_id=current_user.id)
    if not db_interaction:
        return error_response(code=400, message="互动失败")
    UserBusiness.add_experience(db, current_user.id, exp_gain)
    return success_response(data=db_interaction, message="互动成功")


@router.get("/{share_id}/interactions")
def read_share_interactions(
    share_id: int,
    db: Session = Depends(get_db)
):
    interactions = ShareBusiness.get_share_interactions(db, share_id=share_id)
    return success_response(data=interactions)


@router.get("/{share_id}")
def read_share(
    share_id: int,
    db: Session = Depends(get_db)
):
    db_share = ShareBusiness.get_share(db, share_id=share_id)
    if db_share is None:
        return error_response(code=404, message="分享不存在")
    return success_response(data=db_share)


@router.put("/{share_id}")
def update_share(
    share_id: int,
    share_update: ShareUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_share = ShareBusiness.update_share(db, share_id, share_update, user_id=current_user.id)
    if db_share is None:
        return error_response(code=404, message="分享不存在或无权限")
    return success_response(data=db_share)


@router.delete("/{share_id}")
def delete_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = ShareBusiness.delete_share(db, share_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="分享不存在或无权限")
    return success_response(message="删除成功")
