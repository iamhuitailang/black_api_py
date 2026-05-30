from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional
from ..business import GameBusiness

router = APIRouter(prefix="/zashua02/game", tags=["zashua02-game"])


def get_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    try:
        return int(token.split("_")[0])
    except:
        return None


class SaveStateRequest(BaseModel):
    level: Optional[int] = None
    score: Optional[int] = None
    hp: Optional[int] = None
    max_hp: Optional[int] = None
    combo: Optional[int] = None
    max_combo: Optional[int] = None
    difficulty: Optional[str] = None
    theme: Optional[str] = None
    character_type: Optional[str] = None
    props_data: Optional[str] = None
    teammates_data: Optional[str] = None


@router.get("/state")
def get_state(authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    return GameBusiness.get_state(user_id)


@router.post("/state/save")
def save_state(req: SaveStateRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    kwargs = {k: v for k, v in req.dict().items() if v is not None}
    return GameBusiness.save_state_by_user(user_id, **kwargs)


@router.delete("/state/{state_id}")
def delete_state(state_id: int):
    return GameBusiness.delete_state(state_id)


@router.get("/list")
def list_states(page: int = 1, page_size: int = 20):
    return GameBusiness.list_states(page, page_size)
