from typing import List, Optional
from sqlalchemy.orm import Session
from models import UserCollection
from schemas import UserCollectionCreate


class UserCollectionService:
    @staticmethod
    def get_user_collection(db: Session, collection_id: int) -> Optional[UserCollection]:
        return db.query(UserCollection).filter(UserCollection.id == collection_id).first()

    @staticmethod
    def get_user_collections(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[UserCollection]:
        return db.query(UserCollection).filter(UserCollection.user_id == user_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_collection_by_item(db: Session, user_id: int, item_type: str, item_id: int) -> Optional[UserCollection]:
        return db.query(UserCollection).filter(
            UserCollection.user_id == user_id,
            UserCollection.item_type == item_type,
            UserCollection.item_id == item_id
        ).first()

    @staticmethod
    def get_user_collections_by_type(db: Session, user_id: int, item_type: str) -> List[UserCollection]:
        return db.query(UserCollection).filter(
            UserCollection.user_id == user_id,
            UserCollection.item_type == item_type
        ).all()

    @staticmethod
    def create_user_collection(db: Session, collection: UserCollectionCreate) -> UserCollection:
        existing = UserCollectionService.get_user_collection_by_item(
            db, collection.user_id, collection.item_type, collection.item_id
        )
        if existing:
            existing.count += 1
            db.commit()
            db.refresh(existing)
            return existing
        
        db_collection = UserCollection(**collection.dict())
        db.add(db_collection)
        db.commit()
        db.refresh(db_collection)
        return db_collection

    @staticmethod
    def delete_user_collection(db: Session, collection_id: int) -> bool:
        db_collection = UserCollectionService.get_user_collection(db, collection_id)
        if db_collection:
            db.delete(db_collection)
            db.commit()
            return True
        return False
