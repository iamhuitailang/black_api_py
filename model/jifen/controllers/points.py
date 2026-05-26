from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from models.user import User
from business.points import PointsBusiness

router = APIRouter(prefix="/api/points", tags=["积分"])


@router.get("/summary")
def get_summary(current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        summary = PointsBusiness.get_summary(db, current_user.id)
        return ResponseUtil.success(data=summary)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/records")
def get_records(page: int = 1, page_size: int = 10,
               points_type: Optional[str] = None,
               current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    try:
        records, total = PointsBusiness.get_user_records(
            db, current_user.id, page, page_size, points_type)
        return ResponseUtil.page(data=[{
            "id": r.id,
            "points": r.points,
            "type": r.type,
            "description": r.description,
            "balance_after": r.balance_after,
            "created_at": r.created_at
        } for r in records], total=total, page=page, page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/all-records")
def get_all_records(page: int = 1, page_size: int = 10, keyword: str = "",
                    current_user: User = Depends(get_current_admin),
                    db: Session = Depends(get_db)):
    try:
        records, total = PointsBusiness.get_all_records(
            db, page, page_size, keyword)
        return ResponseUtil.page(data=records, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))
