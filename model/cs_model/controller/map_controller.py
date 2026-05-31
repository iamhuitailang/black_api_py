from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database.db import get_db
from ..business.map_business import MapBusiness
from ..utils.response import success_response, error_response
from .user_controller import get_current_user

router = APIRouter(prefix="/api/map", tags=["地图"])

class MapCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    map_type: Optional[str] = "bomb"
    max_players: Optional[int] = 10
    thumbnail: Optional[str] = ""
    scene_data: Optional[str] = ""

class MapUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    map_type: Optional[str] = None
    max_players: Optional[int] = None
    thumbnail: Optional[str] = None
    scene_data: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/list")
def get_maps(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    maps = MapBusiness.get_maps(db, skip, limit)
    return success_response([{
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "type": m.type,
        "max_players": m.max_players,
        "thumbnail": m.thumbnail,
        "scene_data": m.scene_data,
        "is_active": m.is_active
    } for m in maps])

@router.get("/{map_id}")
def get_map(map_id: int, db: Session = Depends(get_db)):
    map_obj = MapBusiness.get_map_by_id(db, map_id)
    if not map_obj:
        return error_response("地图不存在")
    return success_response({
        "id": map_obj.id,
        "name": map_obj.name,
        "description": map_obj.description,
        "type": map_obj.type,
        "max_players": map_obj.max_players,
        "thumbnail": map_obj.thumbnail,
        "scene_data": map_obj.scene_data,
        "is_active": map_obj.is_active
    })

@router.post("/")
def create_map(req: MapCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if MapBusiness.get_map_by_name(db, req.name):
        return error_response("地图名称已存在")
    map_obj = MapBusiness.create_map(db, **req.dict())
    return success_response({"id": map_obj.id}, "创建成功")

@router.put("/{map_id}")
def update_map(map_id: int, req: MapUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    update_data = req.dict(exclude_unset=True)
    if "map_type" in update_data:
        update_data["type"] = update_data.pop("map_type")
    map_obj = MapBusiness.update_map(db, map_id, **update_data)
    if not map_obj:
        return error_response("地图不存在")
    return success_response(None, "更新成功")

@router.delete("/{map_id}")
def delete_map(map_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        return error_response("无权限")
    if MapBusiness.delete_map(db, map_id):
        return success_response(None, "删除成功")
    return error_response("地图不存在")
