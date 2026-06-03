from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import Facility, Park
from model.kl_model.schemas.facility import FacilityCreate, FacilityUpdate


class FacilityBusiness:
    @staticmethod
    def get_facility(db: Session, facility_id: int) -> Optional[Facility]:
        return db.query(Facility).filter(Facility.id == facility_id).first()

    @staticmethod
    def get_facilities_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Facility]:
        return db.query(Facility).filter(Facility.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_facilities_by_park(db: Session, park_id: int) -> List[Facility]:
        return db.query(Facility).filter(Facility.park_id == park_id).all()

    @staticmethod
    def create_facility(db: Session, facility: FacilityCreate, user_id: int) -> Facility:
        park_id = facility.park_id
        if not park_id:
            park = db.query(Park).filter(Park.user_id == user_id).first()
            park_id = park.id if park else None

        db_facility = Facility(
            user_id=user_id,
            park_id=park_id,
            name=facility.name,
            type=facility.type,
            description=facility.description,
            cost=facility.cost,
            position_x=facility.position_x,
            position_y=facility.position_y,
            width=facility.width,
            height=facility.height
        )
        db.add(db_facility)
        db.commit()
        db.refresh(db_facility)
        return db_facility

    @staticmethod
    def update_facility(db: Session, facility_id: int, facility_update: FacilityUpdate, user_id: int) -> Optional[Facility]:
        db_facility = FacilityBusiness.get_facility(db, facility_id)
        if not db_facility or db_facility.user_id != user_id:
            return None
        update_data = facility_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_facility, key, value)
        db.commit()
        db.refresh(db_facility)
        return db_facility

    @staticmethod
    def delete_facility(db: Session, facility_id: int, user_id: int) -> bool:
        db_facility = FacilityBusiness.get_facility(db, facility_id)
        if not db_facility or db_facility.user_id != user_id:
            return False
        db.delete(db_facility)
        db.commit()
        return True

    @staticmethod
    def upgrade_facility(db: Session, facility_id: int, user_id: int) -> tuple[Optional[Facility], float]:
        db_facility = FacilityBusiness.get_facility(db, facility_id)
        if not db_facility or db_facility.user_id != user_id:
            return None, 0
        
        upgrade_cost = db_facility.level * 500.0
        db_facility.level += 1
        db_facility.capacity += 5
        db_facility.income_per_hour *= 1.2
        
        db.commit()
        db.refresh(db_facility)
        return db_facility, upgrade_cost

    @staticmethod
    def collect_income(db: Session, facility_id: int, user_id: int) -> tuple[Optional[Facility], float]:
        db_facility = FacilityBusiness.get_facility(db, facility_id)
        if not db_facility or db_facility.user_id != user_id:
            return None, 0
        
        income = db_facility.income_per_hour
        return db_facility, income
