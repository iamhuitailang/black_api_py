from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.weapon import Weapon

class WeaponBusiness:
    @staticmethod
    def get_weapon_by_id(db: Session, weapon_id: int) -> Optional[Weapon]:
        return db.query(Weapon).filter(Weapon.id == weapon_id).first()

    @staticmethod
    def get_weapon_by_name(db: Session, name: str) -> Optional[Weapon]:
        return db.query(Weapon).filter(Weapon.name == name).first()

    @staticmethod
    def get_weapons(db: Session, skip: int = 0, limit: int = 100, weapon_type: str = None) -> List[Weapon]:
        query = db.query(Weapon)
        if weapon_type:
            query = query.filter(Weapon.type == weapon_type)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def create_weapon(db: Session, name: str, weapon_type: str, damage: int, fire_rate: float,
                      magazine_size: int, reload_time: float, accuracy: float, recoil: float,
                      price: int = 0, description: str = "", image: str = "") -> Weapon:
        db_weapon = Weapon(
            name=name,
            type=weapon_type,
            damage=damage,
            fire_rate=fire_rate,
            magazine_size=magazine_size,
            reload_time=reload_time,
            accuracy=accuracy,
            recoil=recoil,
            price=price,
            description=description,
            image=image
        )
        db.add(db_weapon)
        db.commit()
        db.refresh(db_weapon)
        return db_weapon

    @staticmethod
    def update_weapon(db: Session, weapon_id: int, **kwargs) -> Optional[Weapon]:
        weapon = db.query(Weapon).filter(Weapon.id == weapon_id).first()
        if weapon:
            for key, value in kwargs.items():
                setattr(weapon, key, value)
            db.commit()
            db.refresh(weapon)
        return weapon

    @staticmethod
    def delete_weapon(db: Session, weapon_id: int) -> bool:
        weapon = db.query(Weapon).filter(Weapon.id == weapon_id).first()
        if weapon:
            db.delete(weapon)
            db.commit()
            return True
        return False
