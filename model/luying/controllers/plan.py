from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import CampingPlanCreate, CampingPlanUpdate, PlanItemCreate, PlanItemUpdate, success_response, error_response
from business import plan as plan_business

router = APIRouter(prefix="/api/plan", tags=["露营计划"])


@router.post("/create")
def create_plan(plan: CampingPlanCreate, user_id: int, db: Session = Depends(get_db)):
    if not plan.title:
        return error_response("计划标题不能为空")
    db_plan = plan_business.create_plan(db, plan, user_id)
    return success_response(plan_business.plan_to_dict(db_plan), "创建成功")


@router.get("/list")
def get_user_plans(
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db)
):
    result = plan_business.get_user_plans(db, user_id, page, page_size)
    return success_response({
        "total": result["total"],
        "items": [plan_business.plan_to_dict(p) for p in result["items"]]
    })


@router.get("/templates")
def get_templates(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    result = plan_business.get_templates(db, page, page_size)
    return success_response({
        "total": result["total"],
        "items": [plan_business.plan_to_dict(p) for p in result["items"]]
    })


@router.get("/{plan_id}")
def get_plan_detail(plan_id: int, db: Session = Depends(get_db)):
    db_plan = plan_business.get_plan_by_id(db, plan_id)
    if not db_plan:
        return error_response("计划不存在")
    return success_response(plan_business.plan_to_dict(db_plan))


@router.put("/{plan_id}")
def update_plan(plan_id: int, plan_update: CampingPlanUpdate, db: Session = Depends(get_db)):
    db_plan = plan_business.update_plan(db, plan_id, plan_update)
    if not db_plan:
        return error_response("计划不存在")
    return success_response(plan_business.plan_to_dict(db_plan), "更新成功")


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    success = plan_business.delete_plan(db, plan_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/item")
def create_plan_item(item: PlanItemCreate, db: Session = Depends(get_db)):
    db_item = plan_business.create_plan_item(db, item)
    return success_response({
        "id": db_item.id,
        "name": db_item.name,
        "category": db_item.category,
        "quantity": db_item.quantity,
        "is_checked": db_item.is_checked,
    }, "添加成功")


@router.put("/item/{item_id}")
def update_plan_item(item_id: int, item_update: PlanItemUpdate, db: Session = Depends(get_db)):
    db_item = plan_business.update_plan_item(db, item_id, item_update)
    if not db_item:
        return error_response("物品不存在")
    return success_response({
        "id": db_item.id,
        "name": db_item.name,
        "category": db_item.category,
        "quantity": db_item.quantity,
        "is_checked": db_item.is_checked,
    }, "更新成功")


@router.delete("/item/{item_id}")
def delete_plan_item(item_id: int, db: Session = Depends(get_db)):
    success = plan_business.delete_plan_item(db, item_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")
