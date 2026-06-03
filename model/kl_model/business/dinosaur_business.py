import random
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from model.kl_model.models import Dinosaur, Fossil, DinosaurSpecies, Habitat, Park
from model.kl_model.schemas.dinosaur import DinosaurCreate, DinosaurUpdate, DinosaurCloneRequest


class DinosaurBusiness:
    @staticmethod
    def _get_user_first_park(db: Session, user_id: int) -> Optional[Park]:
        return db.query(Park).filter(Park.user_id == user_id).first()

    @staticmethod
    def get_dinosaur(db: Session, dinosaur_id: int) -> Optional[Dinosaur]:
        return db.query(Dinosaur).filter(Dinosaur.id == dinosaur_id).first()

    @staticmethod
    def get_dinosaurs_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Dinosaur]:
        return db.query(Dinosaur).filter(Dinosaur.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_dinosaurs_by_park(db: Session, park_id: int) -> List[Dinosaur]:
        return db.query(Dinosaur).filter(Dinosaur.park_id == park_id).all()

    @staticmethod
    def get_dinosaurs_by_habitat(db: Session, habitat_id: int) -> List[Dinosaur]:
        return db.query(Dinosaur).filter(Dinosaur.habitat_id == habitat_id).all()

    @staticmethod
    def create_dinosaur(db: Session, dinosaur: DinosaurCreate, user_id: int) -> Dinosaur:
        species = db.query(DinosaurSpecies).filter(DinosaurSpecies.id == dinosaur.species_id).first()
        park_id = dinosaur.park_id
        if not park_id:
            park = DinosaurBusiness._get_user_first_park(db, user_id)
            park_id = park.id if park else None

        db_dinosaur = Dinosaur(
            user_id=user_id,
            park_id=park_id,
            species_id=dinosaur.species_id,
            habitat_id=dinosaur.habitat_id,
            name=dinosaur.name,
            gender=dinosaur.gender or random.choice(["male", "female"]),
            aggression=species.aggression if species else 50,
            intelligence=species.intelligence if species else 50,
            speed=species.speed if species else 50
        )
        db.add(db_dinosaur)
        db.commit()
        db.refresh(db_dinosaur)
        return db_dinosaur

    @staticmethod
    def update_dinosaur(db: Session, dinosaur_id: int, dinosaur_update: DinosaurUpdate, user_id: int) -> Optional[Dinosaur]:
        db_dinosaur = DinosaurBusiness.get_dinosaur(db, dinosaur_id)
        if not db_dinosaur or db_dinosaur.user_id != user_id:
            return None
        update_data = dinosaur_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_dinosaur, key, value)
        db.commit()
        db.refresh(db_dinosaur)
        return db_dinosaur

    @staticmethod
    def delete_dinosaur(db: Session, dinosaur_id: int, user_id: int) -> bool:
        db_dinosaur = DinosaurBusiness.get_dinosaur(db, dinosaur_id)
        if not db_dinosaur or db_dinosaur.user_id != user_id:
            return False
        db.delete(db_dinosaur)
        db.commit()
        return True

    @staticmethod
    def clone_dinosaur(db: Session, request: DinosaurCloneRequest, user_id: int) -> tuple:
        park_id = request.park_id
        if not park_id:
            park = DinosaurBusiness._get_user_first_park(db, user_id)
            park_id = park.id if park else None

        if request.fossil_id:
            fossil = db.query(Fossil).filter(
                Fossil.id == request.fossil_id,
                Fossil.user_id == user_id,
                Fossil.is_complete == True
            ).first()

            if not fossil:
                return None, "没有找到完整的化石", 0, 0

            species = db.query(DinosaurSpecies).filter(DinosaurSpecies.id == fossil.species_id).first()
            if not species:
                return None, "恐龙种类不存在", 0, 0

            clone_cost = species.clone_cost * fossil.quality

            db_dinosaur = Dinosaur(
                user_id=user_id,
                park_id=park_id,
                species_id=species.id,
                habitat_id=request.habitat_id,
                name=request.name,
                gender=random.choice(["male", "female"]),
                aggression=species.aggression + random.randint(-10, 10),
                intelligence=species.intelligence + random.randint(-10, 10),
                speed=species.speed + random.randint(-10, 10)
            )
            db.add(db_dinosaur)
            db.delete(fossil)
            db.commit()
            db.refresh(db_dinosaur)

            exp_gain = 100 * fossil.quality
            return db_dinosaur, f"成功克隆{species.name}！", clone_cost, exp_gain

        elif request.species_id:
            species = db.query(DinosaurSpecies).filter(DinosaurSpecies.id == request.species_id).first()
            if not species:
                return None, "恐龙种类不存在", 0, 0

            clone_cost = species.clone_cost

            db_dinosaur = Dinosaur(
                user_id=user_id,
                park_id=park_id,
                species_id=species.id,
                habitat_id=request.habitat_id,
                name=request.name,
                gender=random.choice(["male", "female"]),
                aggression=species.aggression + random.randint(-10, 10),
                intelligence=species.intelligence + random.randint(-10, 10),
                speed=species.speed + random.randint(-10, 10)
            )
            db.add(db_dinosaur)
            db.commit()
            db.refresh(db_dinosaur)

            exp_gain = 100
            return db_dinosaur, f"成功克隆{species.name}！", clone_cost, exp_gain

        else:
            return None, "请提供fossil_id或species_id", 0, 0

    @staticmethod
    def feed_dinosaur(db: Session, dinosaur_id: int, user_id: int) -> tuple:
        db_dinosaur = DinosaurBusiness.get_dinosaur(db, dinosaur_id)
        if not db_dinosaur or db_dinosaur.user_id != user_id:
            return None, "恐龙不存在", 0

        feed_cost = 50.0
        db_dinosaur.hunger = min(100, db_dinosaur.hunger + 30)
        db_dinosaur.happiness = min(100, db_dinosaur.happiness + 5)
        db_dinosaur.last_fed = datetime.utcnow()
        db.commit()
        db.refresh(db_dinosaur)

        return db_dinosaur, "喂食成功！恐龙很开心", feed_cost

    @staticmethod
    def update_dinosaur_status(db: Session, dinosaur_id: int, user_id: int) -> Optional[Dinosaur]:
        db_dinosaur = DinosaurBusiness.get_dinosaur(db, dinosaur_id)
        if not db_dinosaur or db_dinosaur.user_id != user_id:
            return None

        db_dinosaur.hunger = max(0, db_dinosaur.hunger - random.randint(1, 5))
        db_dinosaur.energy = max(0, db_dinosaur.energy - random.randint(1, 3))

        if db_dinosaur.hunger < 20:
            db_dinosaur.happiness = max(0, db_dinosaur.happiness - random.randint(5, 15))
            db_dinosaur.status = "hungry"
        elif db_dinosaur.energy < 20:
            db_dinosaur.status = "tired"
        else:
            db_dinosaur.status = "healthy"

        behaviors = ["idle", "walking", "eating", "sleeping", "playing", "roaming"]
        db_dinosaur.behavior = random.choice(behaviors)

        db.commit()
        db.refresh(db_dinosaur)
        return db_dinosaur
