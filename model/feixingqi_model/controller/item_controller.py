from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.item_business import ItemBusiness
from model.feixingqi_model.utils import success_response, error_response, ResponseModel
from typing import Optional

router = APIRouter(prefix="/api/feixingqi/item", tags=["飞行棋-道具"])

class CreateItemRequest(BaseModel):
    item_name: str
    item_type: str
    description: str
    effect: str
    price: int = 0
    rarity: str = "common"
    item_icon: Optional[str] = None

class UpdateItemRequest(BaseModel):
    item_id: int
    item_name: Optional[str] = None
    item_type: Optional[str] = None
    description: Optional[str] = None
    effect: Optional[str] = None
    price: Optional[int] = None
    rarity: Optional[str] = None
    item_icon: Optional[str] = None
    status: Optional[int] = None

@router.post("", response_model=ResponseModel)
def create_item(req: CreateItemRequest, db: Session = Depends(get_db)):
    item = ItemBusiness.create_item(db, req.item_name, req.item_type, req.description, req.effect, req.price, req.rarity, req.item_icon)
    return success_response({
        "id": item.id,
        "item_name": item.item_name,
        "item_type": item.item_type,
        "item_icon": item.item_icon,
        "description": item.description,
        "effect": item.effect,
        "price": item.price,
        "rarity": item.rarity
    }, "道具创建成功")

@router.get("/{item_id}", response_model=ResponseModel)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = ItemBusiness.get_item_by_id(db, item_id)
    if not item:
        return error_response(404, "道具不存在")
    return success_response({
        "id": item.id,
        "item_name": item.item_name,
        "item_type": item.item_type,
        "item_icon": item.item_icon,
        "description": item.description,
        "effect": item.effect,
        "price": item.price,
        "rarity": item.rarity,
        "status": item.status
    })

@router.get("", response_model=ResponseModel)
def list_items(page: int = 1, page_size: int = 20, item_type: str = None, rarity: str = None, db: Session = Depends(get_db)):
    items, total = ItemBusiness.get_item_list(db, page, page_size, item_type, rarity)
    item_list = []
    for item in items:
        item_list.append({
            "id": item.id,
            "item_name": item.item_name,
            "item_type": item.item_type,
            "item_icon": item.item_icon,
            "description": item.description,
            "effect": item.effect,
            "price": item.price,
            "rarity": item.rarity,
            "status": item.status
        })
    return success_response({
        "list": item_list,
        "total": total,
        "page": page,
        "page_size": page_size
    })

@router.put("", response_model=ResponseModel)
def update_item(req: UpdateItemRequest, db: Session = Depends(get_db)):
    item = ItemBusiness.update_item(db, req.item_id, 
        item_name=req.item_name,
        item_type=req.item_type,
        description=req.description,
        effect=req.effect,
        price=req.price,
        rarity=req.rarity,
        item_icon=req.item_icon,
        status=req.status
    )
    if not item:
        return error_response(404, "道具不存在")
    return success_response(None, "更新成功")

@router.delete("/{item_id}", response_model=ResponseModel)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    success = ItemBusiness.delete_item(db, item_id)
    if not success:
        return error_response(404, "道具不存在")
    return success_response(None, "删除成功")

@router.get("/user/{user_id}", response_model=ResponseModel)
def get_user_items(user_id: int, db: Session = Depends(get_db)):
    items = ItemBusiness.get_user_items(db, user_id)
    return success_response(items)

@router.post("/user/{user_id}/{item_id}/add", response_model=ResponseModel)
def add_user_item(user_id: int, item_id: int, quantity: int = 1, db: Session = Depends(get_db)):
    ItemBusiness.add_user_item(db, user_id, item_id, quantity)
    return success_response(None, "添加成功")

@router.post("/user/{user_id}/{item_id}/use", response_model=ResponseModel)
def use_user_item(user_id: int, item_id: int, quantity: int = 1, db: Session = Depends(get_db)):
    success = ItemBusiness.use_user_item(db, user_id, item_id, quantity)
    if not success:
        return error_response(400, "道具不足")
    return success_response(None, "使用成功")
