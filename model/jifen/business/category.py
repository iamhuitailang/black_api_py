from sqlalchemy.orm import Session
from typing import List, Optional

from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


class CategoryBusiness:

    @staticmethod
    def create(db: Session, data: CategoryCreate) -> Category:
        category = Category(**data.dict())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def list(db: Session) -> List[Category]:
        return db.query(Category).order_by(Category.sort.asc(), Category.id.asc()).all()

    @staticmethod
    def update(db: Session, category_id: int, data: CategoryUpdate) -> Optional[Category]:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            return None
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete(db: Session, category_id: int) -> bool:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            return False
        db.delete(category)
        db.commit()
        return True
