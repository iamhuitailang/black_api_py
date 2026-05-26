from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from models.product import Product
from models.category import Category
from schemas.product import ProductCreate, ProductUpdate


class ProductBusiness:

    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        product = Product(**data.dict())
        product.total_stock = data.stock
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_detail(db: Session, product_id: int) -> Optional[dict]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        category = db.query(Category).filter(Category.id == product.category_id).first()
        return {
            "id": product.id,
            "category_id": product.category_id,
            "category_name": category.name if category else "",
            "name": product.name,
            "description": product.description,
            "image": product.image,
            "images": product.images,
            "price": product.price,
            "original_price": product.original_price,
            "stock": product.stock,
            "total_stock": product.total_stock,
            "is_hot": product.is_hot,
            "is_online": product.is_online,
            "is_virtual": product.is_virtual,
            "limit_type": product.limit_type,
            "limit_count": product.limit_count,
            "exchange_count": product.exchange_count,
            "sort": product.sort,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }

    @staticmethod
    def list(db: Session, page: int = 1, page_size: int = 10,
             keyword: str = "", category_id: Optional[int] = None,
             is_online: Optional[bool] = None) -> tuple:
        query = db.query(Product)
        if keyword:
            query = query.filter(Product.name.contains(keyword))
        if category_id is not None:
            query = query.filter(Product.category_id == category_id)
        if is_online is not None:
            query = query.filter(Product.is_online == is_online)

        total = query.count()
        products = query.order_by(Product.sort.desc(), Product.id.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for p in products:
            category = db.query(Category).filter(Category.id == p.category_id).first()
            results.append({
                "id": p.id,
                "category_id": p.category_id,
                "category_name": category.name if category else "",
                "name": p.name,
                "image": p.image,
                "price": p.price,
                "original_price": p.original_price,
                "stock": p.stock,
                "is_hot": p.is_hot,
                "is_online": p.is_online,
                "is_virtual": p.is_virtual,
                "exchange_count": p.exchange_count,
                "limit_type": p.limit_type,
                "limit_count": p.limit_count,
                "sort": p.sort,
                "created_at": p.created_at
            })
        return results, total

    @staticmethod
    def list_hot(db: Session, limit: int = 10) -> List[dict]:
        products = db.query(Product).filter(
            Product.is_online == True,
            Product.is_hot == True
        ).order_by(Product.exchange_count.desc()).limit(limit).all()

        results = []
        for p in products:
            category = db.query(Category).filter(Category.id == p.category_id).first()
            results.append({
                "id": p.id,
                "category_id": p.category_id,
                "category_name": category.name if category else "",
                "name": p.name,
                "image": p.image,
                "price": p.price,
                "original_price": p.original_price,
                "stock": p.stock,
                "is_hot": p.is_hot,
                "is_virtual": p.is_virtual,
                "exchange_count": p.exchange_count
            })
        return results

    @staticmethod
    def list_by_category(db: Session, category_id: int, page: int = 1,
                         page_size: int = 10) -> tuple:
        query = db.query(Product).filter(
            Product.category_id == category_id,
            Product.is_online == True
        )
        total = query.count()
        products = query.order_by(Product.sort.desc(), Product.id.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for p in products:
            category = db.query(Category).filter(Category.id == p.category_id).first()
            results.append({
                "id": p.id,
                "category_id": p.category_id,
                "category_name": category.name if category else "",
                "name": p.name,
                "image": p.image,
                "price": p.price,
                "original_price": p.original_price,
                "stock": p.stock,
                "is_hot": p.is_hot,
                "is_virtual": p.is_virtual,
                "exchange_count": p.exchange_count
            })
        return results, total

    @staticmethod
    def update(db: Session, product_id: int, data: ProductUpdate) -> Optional[Product]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(product, key, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product_id: int) -> bool:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return False
        db.delete(product)
        db.commit()
        return True

    @staticmethod
    def update_stock(db: Session, product_id: int, quantity: int) -> Optional[Product]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        if product.stock < quantity:
            raise ValueError("库存不足")
        product.stock -= quantity
        product.exchange_count += quantity
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def toggle_online(db: Session, product_id: int) -> Optional[Product]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
        product.is_online = not product.is_online
        db.commit()
        db.refresh(product)
        return product
