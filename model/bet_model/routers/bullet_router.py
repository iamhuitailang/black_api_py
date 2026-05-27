from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database.config import get_db
from business.bullet_business import BulletBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/bullet", tags=["bullet"])


class BulletCreate(BaseModel):
    name: str
    type: Optional[str] = "normal"
    damage: Optional[float] = 10.0
    speed: Optional[float] = 8.0
    size: Optional[int] = 8
    color: Optional[str] = "#ff6b6b"
    description: Optional[str] = None
    is_tracking: Optional[int] = 0
    cooldown: Optional[float] = 0.5


class BulletUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    damage: Optional[float] = None
    speed: Optional[float] = None
    size: Optional[int] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_tracking: Optional[int] = None
    cooldown: Optional[float] = None


class BulletResponse(BaseModel):
    id: int
    name: str
    type: str
    damage: float
    speed: float
    size: int
    color: str
    description: Optional[str]
    is_tracking: int
    cooldown: float
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[BulletResponse])
def create_bullet(bullet: BulletCreate, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.create(**bullet.model_dump())
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{bullet_id}", response_model=ResponseModel[BulletResponse])
def get_bullet(bullet_id: int, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.get_by_id(bullet_id)
        if not result:
            raise HTTPException(status_code=404, detail="Bullet not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/name/{name}", response_model=ResponseModel[BulletResponse])
def get_bullet_by_name(name: str, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.get_by_name(name)
        if not result:
            raise HTTPException(status_code=404, detail="Bullet not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[BulletResponse]])
def get_all_bullets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/type/{type}", response_model=ResponseModel[List[BulletResponse]])
def get_bullets_by_type(type: str, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.get_by_type(type)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.put("/{bullet_id}", response_model=ResponseModel[BulletResponse])
def update_bullet(bullet_id: int, bullet: BulletUpdate, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.update(bullet_id, **bullet.model_dump(exclude_none=True))
        if not result:
            raise HTTPException(status_code=404, detail="Bullet not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{bullet_id}", response_model=ResponseModel[bool])
def delete_bullet(bullet_id: int, db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.delete(bullet_id)
        if not result:
            raise HTTPException(status_code=404, detail="Bullet not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.post("/init/defaults", response_model=ResponseModel[List[BulletResponse]])
def init_default_bullets(db: Session = Depends(get_db)):
    try:
        business = BulletBusiness(db)
        result = business.init_default_bullets()
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))
