from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import Habitat, Dinosaur, Park
from model.kl_model.schemas.habitat import HabitatCreate, HabitatUpdate


class HabitatBusiness:
    @staticmethod
    def get_habitat(db: Session, habitat_id: int) -> Optional[Habitat]:
        return db.query(Habitat).filter(Habitat.id == habitat_id).first()

    @staticmethod
    def get_habitats_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Habitat]:
        return db.query(Habitat).filter(Habitat.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_habitats_by_park(db: Session, park_id: int) -> List[Habitat]:
        return db.query(Habitat).filter(Habitat.park_id == park_id).all()

    @staticmethod
    def create_habitat(db: Session, habitat: HabitatCreate, user_id: int) -> Habitat:
        park_id = habitat.park_id
        if not park_id:
            park = db.query(Park).filter(Park.user_id == user_id).first()
            park_id = park.id if park else None

        db_habitat = Habitat(
            user_id=user_id,
            park_id=park_id,
            name=habitat.name,
            type=habitat.type,
            description=habitat.description,
            capacity=habitat.capacity,
            position_x=habitat.position_x,
            position_y=habitat.position_y,
            width=habitat.width,
            height=habitat.height
        )
        db.add(db_habitat)
        db.commit()
        db.refresh(db_habitat)
        return db_habitat

    @staticmethod
    def update_habitat(db: Session, habitat_id: int, habitat_update: HabitatUpdate, user_id: int) -> Optional[Habitat]:
        db_habitat = HabitatBusiness.get_habitat(db, habitat_id)
        if not db_habitat or db_habitat.user_id != user_id:
            return None
        update_data = habitat_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_habitat, key, value)
        db.commit()
        db.refresh(db_habitat)
        return db_habitat

    @staticmethod
    def delete_habitat(db: Session, habitat_id: int, user_id: int) -> bool:
        db_habitat = HabitatBusiness.get_habitat(db, habitat_id)
        if not db_habitat or db_habitat.user_id != user_id:
            return False
        db.delete(db_habitat)
        db.commit()
        return True

    @staticmethod
    def get_dinosaur_count(db: Session, habitat_id: int) -> int:
        return db.query(Dinosaur).filter(Dinosaur.habitat_id == habitat_id).count()

    @staticmethod
    def upgrade_habitat(db: Session, habitat_id: int, user_id: int) -> tuple[Optional[Habitat], float]:
        db_habitat = HabitatBusiness.get_habitat(db, habitat_id)
        if not db_habitat or db_habitat.user_id != user_id:
            return None, 0
        
        upgrade_cost = db_habitat.level * 1000.0
        db_habitat.level += 1
        db_habitat.capacity += 2
        db_habitat.size += 50
        db_habitat.security_level = min(100, db_habitat.security_level + 10)
        db_habitat.comfort = min(100, db_habitat.comfort + 5)
        
        db.commit()
        db.refresh(db_habitat)
        return db_habitat, upgrade_cost

    @staticmethod
    def check_compatibility(db: Session, habitat_id: int, species_type: str) -> bool:
        habitat = HabitatBusiness.get_habitat(db, habitat_id)
        if not habitat:
            return False
        type_mapping = {
            "grassland": ["herbivore", "omnivore"],
            "forest": ["herbivore", "omnivore", "carnivore"],
            "desert": ["carnivore", "omnivore"],
            "aquatic": ["aquatic"],
            "mountain": ["herbivore", "carnivore"]
        }
        return species_type in type_mapping.get(habitat.type, [])
