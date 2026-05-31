from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.map import Map

class MapBusiness:
    @staticmethod
    def get_map_by_id(db: Session, map_id: int) -> Optional[Map]:
        return db.query(Map).filter(Map.id == map_id).first()

    @staticmethod
    def get_map_by_name(db: Session, name: str) -> Optional[Map]:
        return db.query(Map).filter(Map.name == name).first()

    @staticmethod
    def get_maps(db: Session, skip: int = 0, limit: int = 100) -> List[Map]:
        return db.query(Map).offset(skip).limit(limit).all()

    @staticmethod
    def create_map(db: Session, name: str, description: str = "", map_type: str = "bomb",
                   max_players: int = 10, thumbnail: str = "", scene_data: str = "") -> Map:
        db_map = Map(
            name=name,
            description=description,
            type=map_type,
            max_players=max_players,
            thumbnail=thumbnail,
            scene_data=scene_data
        )
        db.add(db_map)
        db.commit()
        db.refresh(db_map)
        return db_map

    @staticmethod
    def update_map(db: Session, map_id: int, **kwargs) -> Optional[Map]:
        map_obj = db.query(Map).filter(Map.id == map_id).first()
        if map_obj:
            for key, value in kwargs.items():
                setattr(map_obj, key, value)
            db.commit()
            db.refresh(map_obj)
        return map_obj

    @staticmethod
    def delete_map(db: Session, map_id: int) -> bool:
        map_obj = db.query(Map).filter(Map.id == map_id).first()
        if map_obj:
            db.delete(map_obj)
            db.commit()
            return True
        return False
