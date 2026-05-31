from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.feixingqi_model.database import get_db
from model.feixingqi_model.business.rank_business import RankBusiness
from model.feixingqi_model.utils import success_response, ResponseModel

router = APIRouter(prefix="/api/feixingqi/rank", tags=["飞行棋-排行榜"])

@router.get("", response_model=ResponseModel)
def get_rank_list(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    ranks, total = RankBusiness.get_rank_list(db, page, page_size)
    rank_list = []
    for r in ranks:
        rank_list.append({
            "user_id": r.user_id,
            "username": r.username,
            "nickname": r.nickname,
            "avatar": r.avatar,
            "score": r.score,
            "wins": r.wins,
            "losses": r.losses,
            "win_rate": r.win_rate,
            "rank": r.rank
        })
    return success_response({
        "list": rank_list,
        "total": total,
        "page": page,
        "page_size": page_size
    })

@router.get("/user/{user_id}", response_model=ResponseModel)
def get_user_rank(user_id: int, db: Session = Depends(get_db)):
    rank = RankBusiness.get_user_rank(db, user_id)
    if not rank:
        return success_response(None)
    return success_response({
        "user_id": rank.user_id,
        "username": rank.username,
        "nickname": rank.nickname,
        "avatar": rank.avatar,
        "score": rank.score,
        "wins": rank.wins,
        "losses": rank.losses,
        "win_rate": rank.win_rate,
        "rank": rank.rank
    })

@router.get("/statistics", response_model=ResponseModel)
def get_statistics(db: Session = Depends(get_db)):
    stats = RankBusiness.get_statistics(db)
    return success_response(stats)
