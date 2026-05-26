from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from schemas.category import CategoryCreate, CategoryUpdate
from models.user import User
from business.category import CategoryBusiness

router = APIRouter(prefix="/api/category", tags=["分类"])


@router.post("/")
def create(data: CategoryCreate, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        category = CategoryBusiness.create(db, data)
        return ResponseUtil.success(data={"id": category.id}, message="创建成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list(db: Session = Depends(get_db)):
    try:
        categories = CategoryBusiness.list(db)
        return ResponseUtil.success(data=[{
            "id": c.id,
            "name": c.name,
            "icon": c.icon,
            "description": c.description,
            "sort": c.sort
        } for c in categories])
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/{category_id}")
def get_by_id(category_id: int, db: Session = Depends(get_db)):
    try:
        category = CategoryBusiness.get_by_id(db, category_id)
        if not category:
            return ResponseUtil.error(message="分类不存在", code=404)
        return ResponseUtil.success(data={
            "id": category.id,
            "name": category.name,
            "icon": category.icon,
            "description": category.description,
            "sort": category.sort,
            "created_at": category.created_at
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/{category_id}")
def update(category_id: int, data: CategoryUpdate,
           current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        category = CategoryBusiness.update(db, category_id, data)
        if not category:
            return ResponseUtil.error(message="分类不存在", code=404)
        return ResponseUtil.success(message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{category_id}")
def delete(category_id: int, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        result = CategoryBusiness.delete(db, category_id)
        if not result:
            return ResponseUtil.error(message="分类不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))
