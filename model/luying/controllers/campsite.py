from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import CampsiteCreate, CampsiteUpdate, ReviewCreate, success_response, error_response
from business import campsite as campsite_business

router = APIRouter(prefix="/api/campsite", tags=["营地管理"])


@router.post("/create")
def create_campsite(campsite: CampsiteCreate, user_id: int, db: Session = Depends(get_db)):
    if not campsite.name:
        return error_response("营地名称不能为空")
    db_campsite = campsite_business.create_campsite(db, campsite, user_id)
    return success_response(campsite_business.campsite_to_dict(db_campsite), "创建成功")


@router.get("/list")
def get_campsite_list(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = campsite_business.get_campsite_list(db, page, page_size, keyword, difficulty)
    return success_response({
        "total": result["total"],
        "items": [campsite_business.campsite_to_dict(c) for c in result["items"]]
    })


@router.get("/{campsite_id}")
def get_campsite_detail(campsite_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    db_campsite = campsite_business.get_campsite_by_id(db, campsite_id)
    if not db_campsite:
        return error_response("营地不存在")
    data = campsite_business.campsite_to_dict(db_campsite, include_details=True)
    if user_id:
        data["is_favorited"] = campsite_business.is_favorited(db, campsite_id, user_id)
    return success_response(data)


@router.put("/{campsite_id}")
def update_campsite(campsite_id: int, campsite_update: CampsiteUpdate, db: Session = Depends(get_db)):
    db_campsite = campsite_business.update_campsite(db, campsite_id, campsite_update)
    if not db_campsite:
        return error_response("营地不存在")
    return success_response(campsite_business.campsite_to_dict(db_campsite), "更新成功")


@router.delete("/{campsite_id}")
def delete_campsite(campsite_id: int, db: Session = Depends(get_db)):
    success = campsite_business.delete_campsite(db, campsite_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/review")
def create_review(review: ReviewCreate, user_id: int, db: Session = Depends(get_db)):
    db_review = campsite_business.create_review(db, review, user_id)
    return success_response(campsite_business.review_to_dict(db_review), "评价成功")


@router.get("/review/list/{campsite_id}")
def get_reviews(campsite_id: int, page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    result = campsite_business.get_reviews_by_campsite(db, campsite_id, page, page_size)
    return success_response({
        "total": result["total"],
        "items": [campsite_business.review_to_dict(r) for r in result["items"]]
    })


@router.delete("/review/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    success = campsite_business.delete_review(db, review_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/favorite")
def toggle_favorite(campsite_id: int, user_id: int, db: Session = Depends(get_db)):
    is_fav = campsite_business.is_favorited(db, campsite_id, user_id)
    if is_fav:
        campsite_business.delete_favorite(db, campsite_id, user_id)
        return success_response({"is_favorited": False}, "取消收藏成功")
    else:
        campsite_business.create_favorite(db, campsite_id, user_id)
        return success_response({"is_favorited": True}, "收藏成功")


@router.get("/favorite/list")
def get_user_favorites(user_id: int, page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    result = campsite_business.get_user_favorites(db, user_id, page, page_size)
    return success_response({
        "total": result["total"],
        "items": [campsite_business.campsite_to_dict(c) for c in result["items"]]
    })
