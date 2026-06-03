from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import EquipmentCreate, EquipmentUpdate, ResponseModel, EquipmentResponse, PaginatedResponse
from services import EquipmentService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/equipments", tags=["装备"])


@router.get("/", response_model=PaginatedResponse[EquipmentResponse])
def read_equipments(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equipments = EquipmentService.get_equipments(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[EquipmentResponse.from_orm(e) for e in equipments],
        total=len(equipments),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/type/{type}", response_model=ResponseModel)
def read_equipments_by_type(
    type: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equipments = EquipmentService.get_equipments_by_type(db, type=type)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[EquipmentResponse.from_orm(e) for e in equipments]
    )


@router.get("/unlocked", response_model=ResponseModel)
def read_unlocked_equipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equipments = EquipmentService.get_equipments_by_level(db, level=current_user.level)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[EquipmentResponse.from_orm(e) for e in equipments]
    )


@router.get("/{equipment_id}", response_model=ResponseModel)
def read_equipment(
    equipment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_equipment = EquipmentService.get_equipment(db, equipment_id=equipment_id)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="装备不存在")
    return ResponseModel(code=200, message="获取成功", data=EquipmentResponse.from_orm(db_equipment))


@router.post("/", response_model=ResponseModel)
def create_equipment(
    equipment: EquipmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_equipment = EquipmentService.create_equipment(db=db, equipment=equipment)
    return ResponseModel(code=200, message="创建成功", data=EquipmentResponse.from_orm(db_equipment))


@router.post("/{equipment_id}/upgrade", response_model=ResponseModel)
def upgrade_equipment(
    equipment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_equipment = EquipmentService.upgrade_equipment(db, equipment_id=equipment_id)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="装备不存在或已达最高等级")
    return ResponseModel(code=200, message="升级成功", data=EquipmentResponse.from_orm(db_equipment))


@router.put("/{equipment_id}", response_model=ResponseModel)
def update_equipment(
    equipment_id: int, 
    equipment: EquipmentUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_equipment = EquipmentService.update_equipment(db, equipment_id=equipment_id, equipment=equipment)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="装备不存在")
    return ResponseModel(code=200, message="更新成功", data=EquipmentResponse.from_orm(db_equipment))


@router.delete("/{equipment_id}", response_model=ResponseModel)
def delete_equipment(
    equipment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = EquipmentService.delete_equipment(db, equipment_id=equipment_id)
    if not success:
        raise HTTPException(status_code=404, detail="装备不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
