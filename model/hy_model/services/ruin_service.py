from typing import List, Optional
from sqlalchemy.orm import Session
from models import Ruin
from schemas import RuinCreate, RuinUpdate


class RuinService:
    @staticmethod
    def get_ruin(db: Session, ruin_id: int) -> Optional[Ruin]:
        return db.query(Ruin).filter(Ruin.id == ruin_id).first()

    @staticmethod
    def get_ruins(db: Session, skip: int = 0, limit: int = 100) -> List[Ruin]:
        return db.query(Ruin).offset(skip).limit(limit).all()

    @staticmethod
    def get_ruins_by_depth(db: Session, depth: float) -> List[Ruin]:
        return db.query(Ruin).filter(Ruin.depth <= depth).all()

    @staticmethod
    def get_ruins_by_difficulty(db: Session, difficulty: str) -> List[Ruin]:
        return db.query(Ruin).filter(Ruin.difficulty == difficulty).all()

    @staticmethod
    def get_ruins_by_level(db: Session, level: int) -> List[Ruin]:
        return db.query(Ruin).filter(Ruin.required_level <= level).all()

    @staticmethod
    def create_ruin(db: Session, ruin: RuinCreate) -> Ruin:
        db_ruin = Ruin(**ruin.dict())
        db.add(db_ruin)
        db.commit()
        db.refresh(db_ruin)
        return db_ruin

    @staticmethod
    def update_ruin(db: Session, ruin_id: int, ruin: RuinUpdate) -> Optional[Ruin]:
        db_ruin = RuinService.get_ruin(db, ruin_id)
        if db_ruin:
            update_data = ruin.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_ruin, key, value)
            db.commit()
            db.refresh(db_ruin)
        return db_ruin

    @staticmethod
    def delete_ruin(db: Session, ruin_id: int) -> bool:
        db_ruin = RuinService.get_ruin(db, ruin_id)
        if db_ruin:
            db.delete(db_ruin)
            db.commit()
            return True
        return False
