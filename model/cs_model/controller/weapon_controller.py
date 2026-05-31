from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.db import get_db
from ..business.weapon_business import WeaponBusiness
from ..utils.response import success_response, error_response
from .user_controller import get_current_user

router = APIRouter(prefix="/api/weapon", tags=["武器"])

class WeaponCreateRequest(BaseModel):
    name: str
    weapon_type: str
    damage: int
    fire_rate: float
    magazine_size: int
    reload_time: float
    accuracy: float
    recoil: float
    price: Optional[int] = 0
    description: Optional[str] = ""
    image: Optional[str] = ""

class WeaponUpdateRequest(BaseModel):
    name: Optional[str] = None
    weapon_type: Optional[str] = None
    damage: Optional[int] = None
    fire_rate: Optional[float] = None
    magazine_size: Optional[int] = None
    reload_time: Optional[float] = None
    accuracy: Optional[float] = None
    recoil: Optional[float] = None
    price: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/list")
def get_weapons(db: Session = Depends(get_db), skip: int = 0, limit: int = 100, weapon_type: Optional[str] = None):
    weapons = WeaponBusiness.get_weapons(db, skip, limit, weapon_type)
    return success_response([{
        "id": w.id,
        "name": w.name,
        "type": w.type,
        "damage": w.damage,
        "fire_rate": w.fire_rate,
        "magazine_size": w.magazine_size,
        "reload_time": w.reload_time,
        "accuracy": w.accuracy,
        "recoil": w.recoil,
        "price": w.price,
        "description": w.description,
        "image": w.image,
        "is_active": w.is_active
    } for w in weapons])

@router.get("/{weapon_id}")
def get_weapon(weapon_id: int, db: Session = Depends(get_db)):
    weapon = WeaponBusiness.get_weapon_by_id(db, weapon_id)
    if not weapon:
        return error_response("武器不存在")
    return success_response({
        "id": weapon.id,
        "name": weapon.name,
        "type": weapon.type,
        "damage": weapon.damage,
        "fire_rate": weapon.fire_rate,
        "magazine_size": weapon.magazine_size,
        "reload_time": weapon.reload_time,
        "accuracy": weapon.accuracy,
        "recoil": weapon.recoil,
        "price": weapon.price,
        "description": weapon.description,
        "image": weapon.image,
        "is_active": weapon.is_active
    })

@router.post("/")
def create_weapon(req: WeaponCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if WeaponBusiness.get_weapon_by_name(db, req.name):
        return error_response("武器名称已存在")
    weapon = WeaponBusiness.create_weapon(db, **req.dict())
    return success_response({"id": weapon.id}, "创建成功")

@router.put("/{weapon_id}")
def update_weapon(weapon_id: int, req: WeaponUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    update_data = req.dict(exclude_unset=True)
    if "weapon_type" in update_data:
        update_data["type"] = update_data.pop("weapon_type")
    weapon = WeaponBusiness.update_weapon(db, weapon_id, **update_data)
    if not weapon:
        return error_response("武器不存在")
    return success_response(None, "更新成功")

@router.delete("/{weapon_id}")
def delete_weapon(weapon_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if WeaponBusiness.delete_weapon(db, weapon_id):
        return success_response(None, "删除成功")
    return error_response("武器不存在")
