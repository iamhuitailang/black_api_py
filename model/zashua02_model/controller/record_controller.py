from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional
from ..business import RecordBusiness

router = APIRouter(prefix="/zashua02/record", tags=["zashua02-record"])


def get_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    try:
        return int(token.split("_")[0])
    except:
        return None


class AddRecordRequest(BaseModel):
    level: Optional[int] = 1
    score: Optional[int] = 0
    combo: Optional[int] = 0
    max_combo: Optional[int] = 0
    character_type: Optional[str] = "clown"
    difficulty: Optional[str] = "normal"
    passed: Optional[int] = 0


@router.post("/add")
def add_record(req: AddRecordRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    kwargs = {k: v for k, v in req.dict().items() if v is not None}
    return RecordBusiness.add_record(user_id, **kwargs)


@router.get("/my")
def get_my_records(page: int = 1, page_size: int = 20, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    if not user_id:
        return {"code": 1, "msg": "未登录", "data": None}
    return RecordBusiness.get_user_records(user_id, page, page_size)


@router.get("/rank")
def get_high_scores(limit: int = 10):
    return RecordBusiness.get_high_scores(limit)


@router.delete("/{record_id}")
def delete_record(record_id: int):
    return RecordBusiness.delete_record(record_id)


@router.get("/list")
def list_records(page: int = 1, page_size: int = 20):
    return RecordBusiness.list_records(page, page_size)
