from typing import List, Optional
from sqlalchemy.orm import Session
from models import Creature
from schemas import CreatureCreate, CreatureUpdate


class CreatureService:
    @staticmethod
    def get_creature(db: Session, creature_id: int) -> Optional[Creature]:
        return db.query(Creature).filter(Creature.id == creature_id).first()

    @staticmethod
    def get_creatures(db: Session, skip: int = 0, limit: int = 100) -> List[Creature]:
        return db.query(Creature).offset(skip).limit(limit).all()

    @staticmethod
    def get_creatures_by_depth(db: Session, depth: float) -> List[Creature]:
        return db.query(Creature).filter(
            Creature.min_depth <= depth,
            Creature.max_depth >= depth
        ).all()

    @staticmethod
    def get_creatures_by_rarity(db: Session, rarity: str) -> List[Creature]:
        return db.query(Creature).filter(Creature.rarity == rarity).all()

    @staticmethod
    def get_dangerous_creatures(db: Session) -> List[Creature]:
        return db.query(Creature).filter(Creature.is_dangerous == 1).all()

    @staticmethod
    def create_creature(db: Session, creature: CreatureCreate) -> Creature:
        db_creature = Creature(**creature.dict())
        db.add(db_creature)
        db.commit()
        db.refresh(db_creature)
        return db_creature

    @staticmethod
    def update_creature(db: Session, creature_id: int, creature: CreatureUpdate) -> Optional[Creature]:
        db_creature = CreatureService.get_creature(db, creature_id)
        if db_creature:
            update_data = creature.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_creature, key, value)
            db.commit()
            db.refresh(db_creature)
        return db_creature

    @staticmethod
    def delete_creature(db: Session, creature_id: int) -> bool:
        db_creature = CreatureService.get_creature(db, creature_id)
        if db_creature:
            db.delete(db_creature)
            db.commit()
            return True
        return False
