from sqlalchemy.orm import Session
from models import CampingPlan, PlanItem, User
from schemas import CampingPlanCreate, CampingPlanUpdate, PlanItemCreate, PlanItemUpdate
from datetime import datetime


def create_plan(db: Session, plan: CampingPlanCreate, user_id: int) -> CampingPlan:
    db_plan = CampingPlan(
        user_id=user_id,
        title=plan.title,
        destination=plan.destination,
        start_date=plan.start_date,
        end_date=plan.end_date,
        description=plan.description,
        cover_image=plan.cover_image,
        is_template=plan.is_template,
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    if plan.items:
        for item in plan.items:
            db_item = PlanItem(
                plan_id=db_plan.id,
                name=item.get("name", ""),
                category=item.get("category"),
                quantity=item.get("quantity", 1),
                is_checked=item.get("is_checked", False),
            )
            db.add(db_item)
        db.commit()

    return db_plan


def get_plan_by_id(db: Session, plan_id: int) -> CampingPlan:
    return db.query(CampingPlan).filter(CampingPlan.id == plan_id).first()


def get_user_plans(db: Session, user_id: int, page: int = 1, page_size: int = 10) -> dict:
    query = db.query(CampingPlan).filter(CampingPlan.user_id == user_id)
    total = query.count()
    items = query.order_by(CampingPlan.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def get_templates(db: Session, page: int = 1, page_size: int = 10) -> dict:
    query = db.query(CampingPlan).filter(CampingPlan.is_template == True)
    total = query.count()
    items = query.order_by(CampingPlan.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def update_plan(db: Session, plan_id: int, plan_update: CampingPlanUpdate) -> CampingPlan:
    db_plan = get_plan_by_id(db, plan_id)
    if not db_plan:
        return None
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    db_plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_plan)
    return db_plan


def delete_plan(db: Session, plan_id: int) -> bool:
    db_plan = get_plan_by_id(db, plan_id)
    if not db_plan:
        return False
    db.delete(db_plan)
    db.commit()
    return True


def create_plan_item(db: Session, item: PlanItemCreate) -> PlanItem:
    db_item = PlanItem(
        plan_id=item.plan_id,
        name=item.name,
        category=item.category,
        quantity=item.quantity,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_plan_item(db: Session, item_id: int, item_update: PlanItemUpdate) -> PlanItem:
    db_item = db.query(PlanItem).filter(PlanItem.id == item_id).first()
    if not db_item:
        return None
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_plan_item(db: Session, item_id: int) -> bool:
    db_item = db.query(PlanItem).filter(PlanItem.id == item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def plan_to_dict(plan: CampingPlan) -> dict:
    return {
        "id": plan.id,
        "user_id": plan.user_id,
        "title": plan.title,
        "destination": plan.destination,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "description": plan.description,
        "cover_image": plan.cover_image,
        "status": plan.status,
        "is_template": plan.is_template,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "is_checked": item.is_checked,
            }
            for item in plan.items
        ],
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
    }
