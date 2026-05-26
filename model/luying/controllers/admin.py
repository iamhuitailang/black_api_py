from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import success_response, error_response, EquipmentCreate, CampsiteCreate
from business import admin as admin_business
from business import user as user_business
from business import equipment as equipment_business
from business import campsite as campsite_business
from business import plan as plan_business
from business import community as community_business

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


@router.get("/statistics")
def get_statistics(db: Session = Depends(get_db)):
    data = admin_business.get_statistics(db)
    return success_response(data)


@router.get("/users")
def get_users(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = admin_business.get_all_users(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [user_business.user_to_dict(u) for u in result["items"]]
    })


@router.delete("/user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = user_business.delete_user(db, user_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.get("/equipments")
def get_equipments(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = admin_business.get_all_equipments(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [equipment_business.equipment_to_dict(e) for e in result["items"]]
    })


@router.delete("/equipment/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    success = equipment_business.delete_equipment(db, equipment_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/equipment/create")
def create_equipment(equipment: EquipmentCreate, user_id: int, db: Session = Depends(get_db)):
    if not equipment.name:
        return error_response("装备名称不能为空")
    db_equipment = equipment_business.create_equipment(db, equipment, user_id)
    return success_response(equipment_business.equipment_to_dict(db_equipment), "创建成功")


@router.get("/campsites")
def get_campsites(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = admin_business.get_all_campsites(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [campsite_business.campsite_to_dict(c, include_details=True) for c in result["items"]]
    })


@router.delete("/campsite/{campsite_id}")
def delete_campsite(campsite_id: int, db: Session = Depends(get_db)):
    success = campsite_business.delete_campsite(db, campsite_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.get("/plans")
def get_plans(
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db)
):
    result = admin_business.get_all_plans(db, page, page_size)
    return success_response({
        "total": result["total"],
        "items": [plan_business.plan_to_dict(p) for p in result["items"]]
    })


@router.delete("/plan/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    success = plan_business.delete_plan(db, plan_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.get("/posts")
def get_posts(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = admin_business.get_all_posts(db, page, page_size, keyword)
    return success_response({
        "total": result["total"],
        "items": [community_business.post_to_dict(p) for p in result["items"]]
    })


@router.delete("/post/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    success = community_business.delete_post(db, post_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")
