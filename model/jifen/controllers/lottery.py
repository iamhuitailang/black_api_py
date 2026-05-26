from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from models.user import User
from business.lottery import LotteryBusiness

router = APIRouter(prefix="/api/lottery", tags=["抽奖"])


@router.post("/draw")
def draw(product_id: int, current_user: User = Depends(get_current_user),
         db: Session = Depends(get_db)):
    try:
        result = LotteryBusiness.draw_gacha(db, current_user.id, product_id)
        return ResponseUtil.success(data=result, message="抽奖成功")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/my-records")
def my_records(page: int = 1, page_size: int = 10,
               current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    try:
        records, total = LotteryBusiness.get_user_records(
            db, current_user.id, page, page_size)
        return ResponseUtil.page(data=records, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/all-records")
def all_records(page: int = 1, page_size: int = 10, keyword: str = "",
                current_user: User = Depends(get_current_admin),
                db: Session = Depends(get_db)):
    try:
        records, total = LotteryBusiness.get_all_records(
            db, page, page_size, keyword)
        return ResponseUtil.page(data=records, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))
