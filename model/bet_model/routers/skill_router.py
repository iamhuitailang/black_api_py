from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database.config import get_db
from business.skill_business import SkillBusiness
from controller import success_response, error_response, ResponseModel

router = APIRouter(prefix="/api/skill", tags=["skill"])


class SkillCreate(BaseModel):
    name: str
    display_name: str
    type: Optional[str] = "attack"
    damage: Optional[float] = 25.0
    cooldown: Optional[float] = 10.0
    bullet_count: Optional[int] = 3
    description: Optional[str] = None


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    type: Optional[str] = None
    damage: Optional[float] = None
    cooldown: Optional[float] = None
    bullet_count: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class SkillResponse(BaseModel):
    id: int
    name: str
    display_name: str
    type: str
    damage: float
    cooldown: float
    bullet_count: int
    description: Optional[str]
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=ResponseModel[SkillResponse])
def create_skill(skill: SkillCreate, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.create(**skill.model_dump())
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/{skill_id}", response_model=ResponseModel[SkillResponse])
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.get_by_id(skill_id)
        if not result:
            raise HTTPException(status_code=404, detail="Skill not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/name/{name}", response_model=ResponseModel[SkillResponse])
def get_skill_by_name(name: str, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.get_by_name(name)
        if not result:
            raise HTTPException(status_code=404, detail="Skill not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.get("", response_model=ResponseModel[List[SkillResponse]])
def get_all_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.get_all(skip=skip, limit=limit)
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.get("/active/all", response_model=ResponseModel[List[SkillResponse]])
def get_active_skills(db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.get_all_active()
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))


@router.put("/{skill_id}", response_model=ResponseModel[SkillResponse])
def update_skill(skill_id: int, skill: SkillUpdate, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.update(skill_id, **skill.model_dump(exclude_none=True))
        if not result:
            raise HTTPException(status_code=404, detail="Skill not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.delete("/{skill_id}", response_model=ResponseModel[bool])
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.delete(skill_id)
        if not result:
            raise HTTPException(status_code=404, detail="Skill not found")
        return success_response(result)
    except HTTPException as e:
        return error_response(code=e.status_code, message=e.detail)
    except Exception as e:
        return error_response(message=str(e))


@router.post("/init/defaults", response_model=ResponseModel[List[SkillResponse]])
def init_default_skills(db: Session = Depends(get_db)):
    try:
        business = SkillBusiness(db)
        result = business.init_default_skills()
        return success_response(result)
    except Exception as e:
        return error_response(message=str(e))
