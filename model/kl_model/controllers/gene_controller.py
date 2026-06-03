from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.gene_modification import GeneModificationCreate, GeneModificationApplyRequest
from model.kl_model.business.gene_business import GeneBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/genes", tags=["genes"])


@router.get("")
def read_gene_modifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    genes = GeneBusiness.get_all_gene_modifications(db, user_level=current_user.level)
    return success_response(data=genes)


@router.post("")
def create_gene_modification(
    gene: GeneModificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_gene = GeneBusiness.create_gene_modification(db, gene=gene)
    return success_response(data=db_gene)


@router.post("/apply")
def apply_gene_modification(
    request: GeneModificationApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dinosaur, message, cost_coins, cost_diamonds = GeneBusiness.apply_gene_modification(
        db, 
        dinosaur_id=request.dinosaur_id, 
        gene_id=request.gene_modification_id, 
        user_id=current_user.id
    )
    
    if current_user.coins < cost_coins or current_user.diamonds < cost_diamonds:
        return error_response(code=400, message="金币或钻石不足")
    
    UserBusiness.update_balance(db, current_user.id, coins=-cost_coins, diamonds=-cost_diamonds)
    UserBusiness.add_experience(db, current_user.id, 150)
    
    if not dinosaur:
        return error_response(code=400, message=message)
    
    return success_response(data={"dinosaur": dinosaur, "cost_coins": cost_coins, "cost_diamonds": cost_diamonds}, message=message)


@router.get("/dinosaur/{dinosaur_id}")
def read_dinosaur_gene_modifications(
    dinosaur_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    genes = GeneBusiness.get_dinosaur_gene_modifications(db, dinosaur_id=dinosaur_id, user_id=current_user.id)
    return success_response(data=genes)


@router.get("/{gene_id}")
def read_gene_modification(
    gene_id: int,
    db: Session = Depends(get_db)
):
    db_gene = GeneBusiness.get_gene_modification(db, gene_id=gene_id)
    if db_gene is None:
        return error_response(code=404, message="基因改造不存在")
    return success_response(data=db_gene)
