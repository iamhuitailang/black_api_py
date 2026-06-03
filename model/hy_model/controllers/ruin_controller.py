from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import RuinCreate, RuinUpdate, ResponseModel, RuinResponse, PaginatedResponse
from services import RuinService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/ruins", tags=["遗迹"])


@router.get("/", response_model=PaginatedResponse[RuinResponse])
def read_ruins(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ruins = RuinService.get_ruins(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[RuinResponse.from_orm(r) for r in ruins],
        total=len(ruins),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/depth/{depth}", response_model=ResponseModel)
def read_ruins_by_depth(
    depth: float, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ruins = RuinService.get_ruins_by_depth(db, depth=depth)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[RuinResponse.from_orm(r) for r in ruins]
    )


@router.get("/difficulty/{difficulty}", response_model=ResponseModel)
def read_ruins_by_difficulty(
    difficulty: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ruins = RuinService.get_ruins_by_difficulty(db, difficulty=difficulty)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[RuinResponse.from_orm(r) for r in ruins]
    )


@router.get("/available", response_model=ResponseModel)
def read_available_ruins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ruins = RuinService.get_ruins_by_level(db, level=current_user.level)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[RuinResponse.from_orm(r) for r in ruins]
    )


@router.get("/{ruin_id}", response_model=ResponseModel)
def read_ruin(
    ruin_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_ruin = RuinService.get_ruin(db, ruin_id=ruin_id)
    if db_ruin is None:
        raise HTTPException(status_code=404, detail="遗迹不存在")
    return ResponseModel(code=200, message="获取成功", data=RuinResponse.from_orm(db_ruin))


@router.post("/", response_model=ResponseModel)
def create_ruin(
    ruin: RuinCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_ruin = RuinService.create_ruin(db=db, ruin=ruin)
    return ResponseModel(code=200, message="创建成功", data=RuinResponse.from_orm(db_ruin))


@router.put("/{ruin_id}", response_model=ResponseModel)
def update_ruin(
    ruin_id: int, 
    ruin: RuinUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_ruin = RuinService.update_ruin(db, ruin_id=ruin_id, ruin=ruin)
    if db_ruin is None:
        raise HTTPException(status_code=404, detail="遗迹不存在")
    return ResponseModel(code=200, message="更新成功", data=RuinResponse.from_orm(db_ruin))


@router.delete("/{ruin_id}", response_model=ResponseModel)
def delete_ruin(
    ruin_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = RuinService.delete_ruin(db, ruin_id=ruin_id)
    if not success:
        raise HTTPException(status_code=404, detail="遗迹不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
