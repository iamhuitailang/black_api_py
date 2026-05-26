from sqlalchemy.orm import Session
from models import Equipment, User
from schemas import EquipmentCreate, EquipmentUpdate
from datetime import datetime


def create_equipment(db: Session, equipment: EquipmentCreate, user_id: int) -> Equipment:
    db_equipment = Equipment(
        user_id=user_id,
        name=equipment.name,
        category=equipment.category,
        brand=equipment.brand,
        model=equipment.model,
        weight=equipment.weight,
        price=equipment.price,
        purchase_date=equipment.purchase_date,
        image=equipment.image,
        description=equipment.description,
        condition=equipment.condition,
        is_public=equipment.is_public,
    )
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def get_equipment_by_id(db: Session, equipment_id: int) -> Equipment:
    return db.query(Equipment).filter(Equipment.id == equipment_id).first()


def get_user_equipments(db: Session, user_id: int, page: int = 1, page_size: int = 10, category: str = None) -> dict:
    query = db.query(Equipment).filter(Equipment.user_id == user_id)
    if category:
        query = query.filter(Equipment.category == category)
    total = query.count()
    items = query.order_by(Equipment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def get_public_equipments(db: Session, page: int = 1, page_size: int = 10, keyword: str = None) -> dict:
    query = db.query(Equipment).filter(Equipment.is_public == True)
    if keyword:
        query = query.filter(Equipment.name.contains(keyword))
    total = query.count()
    items = query.order_by(Equipment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def update_equipment(db: Session, equipment_id: int, equipment_update: EquipmentUpdate) -> Equipment:
    db_equipment = get_equipment_by_id(db, equipment_id)
    if not db_equipment:
        return None
    update_data = equipment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_equipment, key, value)
    db_equipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def delete_equipment(db: Session, equipment_id: int) -> bool:
    db_equipment = get_equipment_by_id(db, equipment_id)
    if not db_equipment:
        return False
    db.delete(db_equipment)
    db.commit()
    return True


def get_equipment_categories(db: Session, user_id: int = None) -> list:
    query = db.query(Equipment.category).distinct()
    if user_id:
        query = query.filter(Equipment.user_id == user_id)
    categories = query.all()
    return [c[0] for c in categories if c[0]]


def equipment_to_dict(equipment: Equipment) -> dict:
    return {
        "id": equipment.id,
        "user_id": equipment.user_id,
        "name": equipment.name,
        "category": equipment.category,
        "brand": equipment.brand,
        "model": equipment.model,
        "weight": equipment.weight,
        "price": equipment.price,
        "purchase_date": equipment.purchase_date,
        "image": equipment.image,
        "description": equipment.description,
        "condition": equipment.condition,
        "is_public": equipment.is_public,
        "created_at": equipment.created_at.isoformat() if equipment.created_at else None,
        "updated_at": equipment.updated_at.isoformat() if equipment.updated_at else None,
    }
