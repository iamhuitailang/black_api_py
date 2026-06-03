from typing import List, Optional
from sqlalchemy.orm import Session
from models import Submarine
from schemas import SubmarineCreate, SubmarineUpdate


class SubmarineService:
    @staticmethod
    def get_submarine(db: Session, submarine_id: int) -> Optional[Submarine]:
        return db.query(Submarine).filter(Submarine.id == submarine_id).first()

    @staticmethod
    def get_submarines(db: Session, skip: int = 0, limit: int = 100) -> List[Submarine]:
        return db.query(Submarine).offset(skip).limit(limit).all()

    @staticmethod
    def get_submarines_by_level(db: Session, level: int) -> List[Submarine]:
        return db.query(Submarine).filter(Submarine.unlock_level <= level).all()

    @staticmethod
    def create_submarine(db: Session, submarine: SubmarineCreate) -> Submarine:
        db_submarine = Submarine(**submarine.dict())
        db.add(db_submarine)
        db.commit()
        db.refresh(db_submarine)
        return db_submarine

    @staticmethod
    def update_submarine(db: Session, submarine_id: int, submarine: SubmarineUpdate) -> Optional[Submarine]:
        db_submarine = SubmarineService.get_submarine(db, submarine_id)
        if db_submarine:
            update_data = submarine.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_submarine, key, value)
            db.commit()
            db.refresh(db_submarine)
        return db_submarine

    @staticmethod
    def delete_submarine(db: Session, submarine_id: int) -> bool:
        db_submarine = SubmarineService.get_submarine(db, submarine_id)
        if db_submarine:
            db.delete(db_submarine)
            db.commit()
            return True
        return False
