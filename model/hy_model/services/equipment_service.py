from typing import List, Optional
from sqlalchemy.orm import Session
from models import Equipment
from schemas import EquipmentCreate, EquipmentUpdate


class EquipmentService:
    @staticmethod
    def get_equipment(db: Session, equipment_id: int) -> Optional[Equipment]:
        return db.query(Equipment).filter(Equipment.id == equipment_id).first()

    @staticmethod
    def get_equipments(db: Session, skip: int = 0, limit: int = 100) -> List[Equipment]:
        return db.query(Equipment).offset(skip).limit(limit).all()

    @staticmethod
    def get_equipments_by_type(db: Session, type: str) -> List[Equipment]:
        return db.query(Equipment).filter(Equipment.type == type).all()

    @staticmethod
    def get_equipments_by_level(db: Session, level: int) -> List[Equipment]:
        return db.query(Equipment).filter(Equipment.unlock_level <= level).all()

    @staticmethod
    def create_equipment(db: Session, equipment: EquipmentCreate) -> Equipment:
        db_equipment = Equipment(**equipment.dict())
        db.add(db_equipment)
        db.commit()
        db.refresh(db_equipment)
        return db_equipment

    @staticmethod
    def update_equipment(db: Session, equipment_id: int, equipment: EquipmentUpdate) -> Optional[Equipment]:
        db_equipment = EquipmentService.get_equipment(db, equipment_id)
        if db_equipment:
            update_data = equipment.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_equipment, key, value)
            db.commit()
            db.refresh(db_equipment)
        return db_equipment

    @staticmethod
    def upgrade_equipment(db: Session, equipment_id: int) -> Optional[Equipment]:
        db_equipment = EquipmentService.get_equipment(db, equipment_id)
        if db_equipment and db_equipment.level < db_equipment.max_level:
            db_equipment.level += 1
            db_equipment.effect_value *= 1.2
            db.commit()
            db.refresh(db_equipment)
        return db_equipment

    @staticmethod
    def delete_equipment(db: Session, equipment_id: int) -> bool:
        db_equipment = EquipmentService.get_equipment(db, equipment_id)
        if db_equipment:
            db.delete(db_equipment)
            db.commit()
            return True
        return False
