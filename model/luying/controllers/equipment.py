from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import EquipmentCreate, EquipmentUpdate, success_response, error_response
from business import equipment as equipment_business

router = APIRouter(prefix="/api/equipment", tags=["装备管理"])


@router.post("/create")
def create_equipment(equipment: EquipmentCreate, user_id: int, db: Session = Depends(get_db)):
    if not equipment.name:
        return error_response("装备名称不能为空")
    db_equipment = equipment_business.create_equipment(db, equipment, user_id)
    return success_response(equipment_business.equipment_to_dict(db_equipment), "创建成功")


@router.get("/list")
def get_user_equipments(
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = equipment_business.get_user_equipments(db, user_id, page, page_size, category)
    return success_response({
        "total": result["total"],
        "items": [equipment_business.equipment_to_dict(e) for e in result["items"]]
    })


@router.get("/public")
def get_public_equipments(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = equipment_business.get_public_equipments(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [equipment_business.equipment_to_dict(e) for e in result["items"]]
    })


@router.get("/categories")
def get_categories(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    categories = equipment_business.get_equipment_categories(db, user_id)
    return success_response({"categories": categories})


@router.get("/{equipment_id}")
def get_equipment_detail(equipment_id: int, db: Session = Depends(get_db)):
    db_equipment = equipment_business.get_equipment_by_id(db, equipment_id)
    if not db_equipment:
        return error_response("装备不存在")
    return success_response(equipment_business.equipment_to_dict(db_equipment))


@router.put("/{equipment_id}")
def update_equipment(equipment_id: int, equipment_update: EquipmentUpdate, db: Session = Depends(get_db)):
    db_equipment = equipment_business.update_equipment(db, equipment_id, equipment_update)
    if not db_equipment:
        return error_response("装备不存在")
    return success_response(equipment_business.equipment_to_dict(db_equipment), "更新成功")


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    success = equipment_business.delete_equipment(db, equipment_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")
