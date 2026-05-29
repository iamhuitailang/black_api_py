from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    rating: int = Field(5, ge=1, le=5, description="评分1-5")
    content: str = Field(..., description="评价内容")


class HuodongReviewController:
    def __init__(self):
        from app.business.huodong.review_business import ReviewBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.review_business = ReviewBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        创建评价
        POST /api/huodong/review/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.create_review(
            user_id=user.get('id'),
            activity_id=body.activity_id,
            rating=body.rating,
            content=body.content
        )

    def ActionHuodongReviewListGet(self, request: Request,
                                    activity_id: int = Query(..., description="活动ID"),
                                    page: int = Query(1, ge=1),
                                    page_size: int = Query(20, ge=1, le=100)):
        """
        获取活动评价列表
        GET /api/huodong/review/list/get
        """
        return self.review_business.get_reviews_by_activity(activity_id, page, page_size)

    def ActionHuodongReviewMyListGet(self, request: Request,
                                      page: int = Query(1, ge=1),
                                      page_size: int = Query(10, ge=1, le=100),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的评价列表
        GET /api/huodong/review/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.get_my_reviews(user.get('id'), page, page_size)

    def ActionHuodongReviewDeletePost(self, request: Request,
                                       review_id: int = Query(..., description="评价ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除评价
        POST /api/huodong/review/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.delete_review(user.get('id'), review_id)
