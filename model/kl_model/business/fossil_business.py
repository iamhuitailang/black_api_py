import random
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from model.kl_model.models import Fossil, DinosaurSpecies
from model.kl_model.schemas.fossil import FossilCreate, FossilUpdate, FossilExcavateRequest


class FossilBusiness:
    @staticmethod
    def get_fossil(db: Session, fossil_id: int) -> Optional[Fossil]:
        return db.query(Fossil).filter(Fossil.id == fossil_id).first()

    @staticmethod
    def get_fossils_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Fossil]:
        return db.query(Fossil).filter(Fossil.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_complete_fossils_by_user(db: Session, user_id: int) -> List[Fossil]:
        return db.query(Fossil).filter(Fossil.user_id == user_id, Fossil.is_complete == True).all()

    @staticmethod
    def create_fossil(db: Session, fossil: FossilCreate, user_id: int) -> Fossil:
        species = db.query(DinosaurSpecies).filter(DinosaurSpecies.id == fossil.species_id).first()
        fragments_needed = 5 if species and species.rarity == "common" else 10 if species and species.rarity == "rare" else 15
        
        db_fossil = Fossil(
            user_id=user_id,
            species_id=fossil.species_id,
            location=fossil.location,
            fragments_needed=fragments_needed
        )
        db.add(db_fossil)
        db.commit()
        db.refresh(db_fossil)
        return db_fossil

    @staticmethod
    def update_fossil(db: Session, fossil_id: int, fossil_update: FossilUpdate, user_id: int) -> Optional[Fossil]:
        db_fossil = FossilBusiness.get_fossil(db, fossil_id)
        if not db_fossil or db_fossil.user_id != user_id:
            return None
        update_data = fossil_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_fossil, key, value)
        db.commit()
        db.refresh(db_fossil)
        return db_fossil

    @staticmethod
    def delete_fossil(db: Session, fossil_id: int, user_id: int) -> bool:
        db_fossil = FossilBusiness.get_fossil(db, fossil_id)
        if not db_fossil or db_fossil.user_id != user_id:
            return False
        db.delete(db_fossil)
        db.commit()
        return True

    @staticmethod
    def excavate_fossil(db: Session, request: FossilExcavateRequest, user_id: int) -> Tuple[Optional[Fossil], str, int]:
        locations = {
            "desert": {"common": 0.6, "rare": 0.3, "legendary": 0.1},
            "jungle": {"common": 0.5, "rare": 0.35, "legendary": 0.15},
            "mountain": {"common": 0.4, "rare": 0.4, "legendary": 0.2},
            "coast": {"common": 0.55, "rare": 0.32, "legendary": 0.13}
        }
        
        location_rarity = locations.get(request.location, locations["desert"])
        
        difficulty_multiplier = {
            "easy": 0.5,
            "normal": 1.0,
            "hard": 1.5
        }.get(request.difficulty, 1.0)
        
        rand = random.random()
        if rand < location_rarity["legendary"] * difficulty_multiplier * 0.3:
            rarity = "legendary"
        elif rand < location_rarity["rare"] * difficulty_multiplier * 0.5:
            rarity = "rare"
        else:
            rarity = "common"
        
        species = db.query(DinosaurSpecies).filter(DinosaurSpecies.rarity == rarity).order_by(func.random()).first()
        if not species:
            species = db.query(DinosaurSpecies).order_by(func.random()).first()
        
        if not species:
            return None, "没有发现化石", 0
        
        existing_fossil = db.query(Fossil).filter(
            Fossil.user_id == user_id,
            Fossil.species_id == species.id,
            Fossil.is_complete == False
        ).first()
        
        exp_gain = 50 if rarity == "legendary" else 30 if rarity == "rare" else 10
        
        if existing_fossil:
            existing_fossil.fragments += 1
            existing_fossil.quality = min(5, existing_fossil.quality + random.randint(0, 1))
            if existing_fossil.fragments >= existing_fossil.fragments_needed:
                existing_fossil.is_complete = True
            db.commit()
            db.refresh(existing_fossil)
            return existing_fossil, f"发现{species.name}化石碎片！", exp_gain
        
        db_fossil = Fossil(
            user_id=user_id,
            species_id=species.id,
            location=request.location,
            quality=random.randint(1, 3),
            fragments_needed=5 if rarity == "common" else 10 if rarity == "rare" else 15
        )
        db.add(db_fossil)
        db.commit()
        db.refresh(db_fossil)
        
        return db_fossil, f"发现新的{species.name}化石！", exp_gain

    @staticmethod
    def combine_fossils(db: Session, fossil_ids: List[int], user_id: int) -> Tuple[Optional[Fossil], str]:
        fossils = db.query(Fossil).filter(
            Fossil.id.in_(fossil_ids),
            Fossil.user_id == user_id,
            Fossil.is_complete == False
        ).all()
        
        if len(fossils) < 2:
            return None, "需要至少2个同种类化石碎片"
        
        species_ids = set(f.species_id for f in fossils)
        if len(species_ids) > 1:
            return None, "只能合并同种类的化石"
        
        species_id = species_ids.pop()
        total_fragments = sum(f.fragments for f in fossils)
        max_quality = max(f.quality for f in fossils)
        
        for fossil in fossils:
            db.delete(fossil)
        
        fragments_needed = fossils[0].fragments_needed
        is_complete = total_fragments >= fragments_needed
        
        new_fossil = Fossil(
            user_id=user_id,
            species_id=species_id,
            quality=min(5, max_quality + 1),
            fragments=total_fragments,
            fragments_needed=fragments_needed,
            is_complete=is_complete
        )
        db.add(new_fossil)
        db.commit()
        db.refresh(new_fossil)
        
        if is_complete:
            return new_fossil, "化石组合完成！可以用于克隆恐龙了"
        return new_fossil, f"化石组合成功！当前进度: {total_fragments}/{fragments_needed}"
