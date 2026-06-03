from typing import List, Optional
from sqlalchemy.orm import Session
from models import Treasure
from schemas import TreasureCreate, TreasureUpdate


class TreasureService:
    @staticmethod
    def get_treasure(db: Session, treasure_id: int) -> Optional[Treasure]:
        return db.query(Treasure).filter(Treasure.id == treasure_id).first()

    @staticmethod
    def get_treasures(db: Session, skip: int = 0, limit: int = 100) -> List[Treasure]:
        return db.query(Treasure).offset(skip).limit(limit).all()

    @staticmethod
    def get_treasures_by_depth(db: Session, depth: float) -> List[Treasure]:
        return db.query(Treasure).filter(
            Treasure.min_depth <= depth,
            Treasure.max_depth >= depth
        ).all()

    @staticmethod
    def get_treasures_by_rarity(db: Session, rarity: str) -> List[Treasure]:
        return db.query(Treasure).filter(Treasure.rarity == rarity).all()

    @staticmethod
    def create_treasure(db: Session, treasure: TreasureCreate) -> Treasure:
        db_treasure = Treasure(**treasure.dict())
        db.add(db_treasure)
        db.commit()
        db.refresh(db_treasure)
        return db_treasure

    @staticmethod
    def update_treasure(db: Session, treasure_id: int, treasure: TreasureUpdate) -> Optional[Treasure]:
        db_treasure = TreasureService.get_treasure(db, treasure_id)
        if db_treasure:
            update_data = treasure.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_treasure, key, value)
            db.commit()
            db.refresh(db_treasure)
        return db_treasure

    @staticmethod
    def delete_treasure(db: Session, treasure_id: int) -> bool:
        db_treasure = TreasureService.get_treasure(db, treasure_id)
        if db_treasure:
            db.delete(db_treasure)
            db.commit()
            return True
        return False
