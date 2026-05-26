from sqlalchemy.orm import Session
from typing import List, Optional

from models.address import Address
from schemas.address import AddressCreate, AddressUpdate


class AddressBusiness:

    @staticmethod
    def create(db: Session, user_id: int, data: AddressCreate) -> Address:
        if data.is_default:
            db.query(Address).filter(
                Address.user_id == user_id,
                Address.is_default == True
            ).update({Address.is_default: False})

        address = Address(user_id=user_id, **data.dict())
        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    @staticmethod
    def get_by_id(db: Session, address_id: int) -> Optional[Address]:
        return db.query(Address).filter(Address.id == address_id).first()

    @staticmethod
    def list_by_user(db: Session, user_id: int) -> List[Address]:
        return db.query(Address).filter(
            Address.user_id == user_id
        ).order_by(Address.is_default.desc(), Address.id.desc()).all()

    @staticmethod
    def get_default(db: Session, user_id: int) -> Optional[Address]:
        address = db.query(Address).filter(
            Address.user_id == user_id,
            Address.is_default == True
        ).first()
        if not address:
            address = db.query(Address).filter(
                Address.user_id == user_id
            ).order_by(Address.id.desc()).first()
        return address

    @staticmethod
    def update(db: Session, address_id: int, user_id: int,
               data: AddressUpdate) -> Optional[Address]:
        address = db.query(Address).filter(
            Address.id == address_id,
            Address.user_id == user_id
        ).first()
        if not address:
            return None

        if data.is_default:
            db.query(Address).filter(
                Address.user_id == user_id,
                Address.is_default == True
            ).update({Address.is_default: False})

        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(address, key, value)
        db.commit()
        db.refresh(address)
        return address

    @staticmethod
    def set_default(db: Session, address_id: int, user_id: int) -> bool:
        address = db.query(Address).filter(
            Address.id == address_id,
            Address.user_id == user_id
        ).first()
        if not address:
            return False

        db.query(Address).filter(
            Address.user_id == user_id,
            Address.is_default == True
        ).update({Address.is_default: False})

        address.is_default = True
        db.commit()
        return True

    @staticmethod
    def delete(db: Session, address_id: int, user_id: int) -> bool:
        address = db.query(Address).filter(
            Address.id == address_id,
            Address.user_id == user_id
        ).first()
        if not address:
            return False
        db.delete(address)
        db.commit()
        return True
