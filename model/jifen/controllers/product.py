from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from schemas.product import ProductCreate, ProductUpdate
from models.user import User
from business.product import ProductBusiness

router = APIRouter(prefix="/api/product", tags=["商品"])


@router.post("/")
def create(data: ProductCreate, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        product = ProductBusiness.create(db, data)
        return ResponseUtil.success(data={"id": product.id}, message="创建成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list(page: int = 1, page_size: int = 10, keyword: str = "",
         category_id: Optional[int] = None, is_online: Optional[bool] = None,
         db: Session = Depends(get_db)):
    try:
        products, total = ProductBusiness.list(db, page, page_size, keyword,
                                                category_id, is_online)
        return ResponseUtil.page(data=products, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/hot")
def list_hot(limit: int = 10, db: Session = Depends(get_db)):
    try:
        products = ProductBusiness.list_hot(db, limit)
        return ResponseUtil.success(data=products)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/category/{category_id}")
def list_by_category(category_id: int, page: int = 1, page_size: int = 10,
                     db: Session = Depends(get_db)):
    try:
        products, total = ProductBusiness.list_by_category(
            db, category_id, page, page_size)
        return ResponseUtil.page(data=products, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/{product_id}")
def get_by_id(product_id: int, db: Session = Depends(get_db)):
    try:
        product = ProductBusiness.get_detail(db, product_id)
        if not product:
            return ResponseUtil.error(message="商品不存在", code=404)
        return ResponseUtil.success(data=product)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/{product_id}")
def update(product_id: int, data: ProductUpdate,
           current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        product = ProductBusiness.update(db, product_id, data)
        if not product:
            return ResponseUtil.error(message="商品不存在", code=404)
        return ResponseUtil.success(message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{product_id}")
def delete(product_id: int, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        result = ProductBusiness.delete(db, product_id)
        if not result:
            return ResponseUtil.error(message="商品不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/toggle/{product_id}")
def toggle_online(product_id: int,
                  current_user: User = Depends(get_current_admin),
                  db: Session = Depends(get_db)):
    try:
        product = ProductBusiness.toggle_online(db, product_id)
        if not product:
            return ResponseUtil.error(message="商品不存在", code=404)
        return ResponseUtil.success(data={
            "is_online": product.is_online
        }, message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))
