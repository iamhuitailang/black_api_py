from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import Park
from model.kl_model.schemas.park import ParkCreate, ParkUpdate


class ParkBusiness:
    @staticmethod
    def get_park(db: Session, park_id: int) -> Optional[Park]:
        return db.query(Park).filter(Park.id == park_id).first()

    @staticmethod
    def get_parks_by_user(db: Session, user_id: int) -> List[Park]:
        return db.query(Park).filter(Park.user_id == user_id).all()

    @staticmethod
    def get_all_parks(db: Session, skip: int = 0, limit: int = 100) -> List[Park]:
        return db.query(Park).offset(skip).limit(limit).all()

    @staticmethod
    def create_park(db: Session, park: ParkCreate, user_id: int) -> Park:
        db_park = Park(
            user_id=user_id,
            name=park.name,
            description=park.description,
            theme=park.theme
        )
        db.add(db_park)
        db.commit()
        db.refresh(db_park)
        return db_park

    @staticmethod
    def update_park(db: Session, park_id: int, park_update: ParkUpdate, user_id: int) -> Optional[Park]:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park or db_park.user_id != user_id:
            return None
        update_data = park_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_park, key, value)
        db.commit()
        db.refresh(db_park)
        return db_park

    @staticmethod
    def delete_park(db: Session, park_id: int, user_id: int) -> bool:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park or db_park.user_id != user_id:
            return False
        db.delete(db_park)
        db.commit()
        return True

    @staticmethod
    def add_visitor(db: Session, park_id: int) -> Optional[Park]:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park:
            return None
        db_park.visitor_count += 1
        db.commit()
        db.refresh(db_park)
        return db_park

    @staticmethod
    def add_income(db: Session, park_id: int, amount: float) -> Optional[Park]:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park:
            return None
        db_park.income += amount
        db.commit()
        db.refresh(db_park)
        return db_park

    @staticmethod
    def update_reputation(db: Session, park_id: int, change: int) -> Optional[Park]:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park:
            return None
        db_park.reputation = max(0, db_park.reputation + change)
        db.commit()
        db.refresh(db_park)
        return db_park

    @staticmethod
    def update_rating(db: Session, park_id: int) -> Optional[Park]:
        db_park = ParkBusiness.get_park(db, park_id)
        if not db_park:
            return None
        rating = (db_park.safety_level * 0.3 + db_park.reputation * 0.4 + db_park.visitor_count * 0.001) / 100
        db_park.rating = min(5.0, max(0.0, rating))
        db.commit()
        db.refresh(db_park)
        return db_park
