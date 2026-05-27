from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..business.character_business import CharacterBusiness
from ..business.user_business import UserBusiness
from ..utils import json_response, decode_access_token

router = APIRouter(prefix="/api/character", tags=["character"])


class CreateCharacterRequest(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#FFB6C1"
    head_color: str = "#FFE4E1"
    body_color: str = "#FFB6C1"
    unlock_condition: Optional[str] = None
    is_default: bool = False


class UpdateCharacterRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    head_color: Optional[str] = None
    body_color: Optional[str] = None
    unlock_condition: Optional[str] = None
    is_default: Optional[bool] = None


def get_current_user(token: str, db: Session):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    user = UserBusiness.get_user_by_id(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.get("/list")
def list_characters(token: str, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        characters = CharacterBusiness.list_characters(db)
        return json_response(data=[{
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "color": c.color,
            "head_color": c.head_color,
            "body_color": c.body_color,
            "unlock_condition": c.unlock_condition,
            "is_default": c.is_default
        } for c in characters])
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.get("/{character_id}")
def get_character(token: str, character_id: int, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        character = CharacterBusiness.get_character_by_id(db, character_id)
        if not character:
            return json_response(code=404, message="角色不存在")
        return json_response(data={
            "id": character.id,
            "name": character.name,
            "description": character.description,
            "color": character.color,
            "head_color": character.head_color,
            "body_color": character.body_color,
            "unlock_condition": character.unlock_condition,
            "is_default": character.is_default
        })
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.post("/create")
def create_character(token: str, request: CreateCharacterRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        character = CharacterBusiness.create_character(
            db, request.name, request.description, request.color,
            request.head_color, request.body_color, request.unlock_condition, request.is_default
        )
        return json_response(data={"id": character.id, "name": character.name})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.put("/{character_id}")
def update_character(token: str, character_id: int, request: UpdateCharacterRequest, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        updated = CharacterBusiness.update_character(
            db, character_id,
            name=request.name,
            description=request.description,
            color=request.color,
            head_color=request.head_color,
            body_color=request.body_color,
            unlock_condition=request.unlock_condition,
            is_default=request.is_default
        )
        if not updated:
            return json_response(code=404, message="角色不存在")
        return json_response(data={"id": updated.id, "name": updated.name})
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)


@router.delete("/{character_id}")
def delete_character(token: str, character_id: int, db: Session = Depends(get_db)):
    try:
        get_current_user(token, db)
        success = CharacterBusiness.delete_character(db, character_id)
        if not success:
            return json_response(code=404, message="角色不存在")
        return json_response(message="删除成功")
    except HTTPException as e:
        return json_response(code=e.status_code, message=e.detail)
