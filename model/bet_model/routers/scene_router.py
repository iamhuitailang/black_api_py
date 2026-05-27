from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database.config import get_db
from business.scene_business import SceneBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/scene", tags=["scene"])


class SceneCreate(BaseModel):
    name: str
    display_name: str
    background_color: Optional[str] = "#0a0a1a"
    ground_color: Optional[str] = "#1a1a2e"
    accent_color: Optional[str] = "#4a90d9"
    description: Optional[str] = None


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    background_color: Optional[str] = None
    ground_color: Optional[str] = None
    accent_color: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class SceneResponse(BaseModel):
    id: int
    name: str
    display_name: str
    background_color: str
    ground_color: str
    accent_color: str
    description: Optional[str]
    is_active: int

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[SceneResponse])
def create_scene(scene: SceneCreate, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.create(**scene.model_dump())
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{scene_id}", response_model=ResponseModel[SceneResponse])
def get_scene(scene_id: int, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.get_by_id(scene_id)
        if not result:
            raise HTTPException(status_code=404, detail="Scene not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/name/{name}", response_model=ResponseModel[SceneResponse])
def get_scene_by_name(name: str, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.get_by_name(name)
        if not result:
            raise HTTPException(status_code=404, detail="Scene not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[SceneResponse]])
def get_all_scenes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/active/all", response_model=ResponseModel[List[SceneResponse]])
def get_active_scenes(db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.get_all_active()
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.put("/{scene_id}", response_model=ResponseModel[SceneResponse])
def update_scene(scene_id: int, scene: SceneUpdate, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.update(scene_id, **scene.model_dump(exclude_none=True))
        if not result:
            raise HTTPException(status_code=404, detail="Scene not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{scene_id}", response_model=ResponseModel[bool])
def delete_scene(scene_id: int, db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.delete(scene_id)
        if not result:
            raise HTTPException(status_code=404, detail="Scene not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.post("/init/defaults", response_model=ResponseModel[List[SceneResponse]])
def init_default_scenes(db: Session = Depends(get_db)):
    try:
        business = SceneBusiness(db)
        result = business.init_default_scenes()
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))
