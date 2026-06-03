from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import SubmarineCreate, SubmarineUpdate, ResponseModel, SubmarineResponse, PaginatedResponse
from services import SubmarineService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/submarines", tags=["潜水艇"])


@router.get("/", response_model=PaginatedResponse[SubmarineResponse])
def read_submarines(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submarines = SubmarineService.get_submarines(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[SubmarineResponse.from_orm(s) for s in submarines],
        total=len(submarines),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/unlocked", response_model=ResponseModel)
def read_unlocked_submarines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submarines = SubmarineService.get_submarines_by_level(db, level=current_user.level)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[SubmarineResponse.from_orm(s) for s in submarines]
    )


@router.get("/{submarine_id}", response_model=ResponseModel)
def read_submarine(
    submarine_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_submarine = SubmarineService.get_submarine(db, submarine_id=submarine_id)
    if db_submarine is None:
        raise HTTPException(status_code=404, detail="潜水艇不存在")
    return ResponseModel(code=200, message="获取成功", data=SubmarineResponse.from_orm(db_submarine))


@router.post("/", response_model=ResponseModel)
def create_submarine(
    submarine: SubmarineCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_submarine = SubmarineService.create_submarine(db=db, submarine=submarine)
    return ResponseModel(code=200, message="创建成功", data=SubmarineResponse.from_orm(db_submarine))


@router.put("/{submarine_id}", response_model=ResponseModel)
def update_submarine(
    submarine_id: int, 
    submarine: SubmarineUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_submarine = SubmarineService.update_submarine(db, submarine_id=submarine_id, submarine=submarine)
    if db_submarine is None:
        raise HTTPException(status_code=404, detail="潜水艇不存在")
    return ResponseModel(code=200, message="更新成功", data=SubmarineResponse.from_orm(db_submarine))


@router.delete("/{submarine_id}", response_model=ResponseModel)
def delete_submarine(
    submarine_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = SubmarineService.delete_submarine(db, submarine_id=submarine_id)
    if not success:
        raise HTTPException(status_code=404, detail="潜水艇不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
