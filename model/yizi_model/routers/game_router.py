from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import GameRecordCreate, ResponseModel, GameRecordResponse
from services import GameService
from .user_router import get_current_user

router = APIRouter(prefix="/api/game", tags=["游戏"])


@router.post("/record", response_model=ResponseModel)
def create_record(record_data: GameRecordCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    record = GameService.create_record(db, record_data)
    return ResponseModel(data=GameRecordResponse.model_validate(record))


@router.get("/records", response_model=ResponseModel)
def get_my_records(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    records = GameService.get_records_by_player(db, current_user.id, skip, limit)
    return ResponseModel(data=[GameRecordResponse.model_validate(r) for r in records])


@router.get("/record/{record_id}", response_model=ResponseModel)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = GameService.get_record_by_id(db, record_id)
    if not record:
        return ResponseModel(code=404, message="记录不存在")
    return ResponseModel(data=GameRecordResponse.model_validate(record))


@router.get("/all", response_model=ResponseModel)
def list_all_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = GameService.list_all_records(db, skip, limit)
    return ResponseModel(data=[GameRecordResponse.model_validate(r) for r in records])


@router.delete("/record/{record_id}", response_model=ResponseModel)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    success = GameService.delete_record(db, record_id)
    if not success:
        return ResponseModel(code=404, message="记录不存在")
    return ResponseModel(message="删除成功")
