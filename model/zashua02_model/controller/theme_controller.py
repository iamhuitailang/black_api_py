from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..business import ThemeBusiness

router = APIRouter(prefix="/zashua02/theme", tags=["zashua02-theme"])


class CreateThemeRequest(BaseModel):
    name: str
    type: str
    bg_color: Optional[str] = ""
    accent_color: Optional[str] = ""
    text_color: Optional[str] = ""
    config: Optional[str] = ""


class UpdateThemeRequest(BaseModel):
    name: Optional[str] = None
    bg_color: Optional[str] = None
    accent_color: Optional[str] = None
    text_color: Optional[str] = None
    config: Optional[str] = None


@router.get("/list")
def get_all_themes():
    return ThemeBusiness.get_all_themes()


@router.get("/{type}")
def get_theme(type: str):
    return ThemeBusiness.get_theme(type)


@router.post("/create")
def create_theme(req: CreateThemeRequest):
    return ThemeBusiness.create_theme(req.name, req.type, req.bg_color, req.accent_color, req.text_color, req.config)


@router.put("/{theme_id}")
def update_theme(theme_id: int, req: UpdateThemeRequest):
    kwargs = {k: v for k, v in req.dict().items() if v is not None}
    return ThemeBusiness.update_theme(theme_id, **kwargs)


@router.delete("/{theme_id}")
def delete_theme(theme_id: int):
    return ThemeBusiness.delete_theme(theme_id)
