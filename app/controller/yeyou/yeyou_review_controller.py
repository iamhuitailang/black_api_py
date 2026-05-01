from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    target_user_id: int = Field(..., description="被评价用户ID")
    rating: int = Field(default=5, description="评分(1-5)")
    content: Optional[str] = Field(None, description="评价内容")


class YeyouReviewController:
    def __init__(self):
        from app.business.yeyou.review_business import ReviewBusiness
        self.review_business = ReviewBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yeyou.user_business import YeyouUserBusiness
        user_business = YeyouUserBusiness()
        return user_business.verify_token(token)

    def ActionYeyouReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发表评价接口
        POST /api/yeyou/review/create
        活动结束后评价队友
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.create_review(
            activity_id=body.activity_id,
            reviewer_id=user.get('id'),
            target_user_id=body.target_user_id,
            rating=body.rating,
            content=body.content or ''
        )

    def ActionYeyouReviewUserGet(self, request: Request,
                                  target_user_id: int = Query(..., description="目标用户ID"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取用户评价接口
        GET /api/yeyou/review/user/get
        获取指定用户收到的所有评价
        """
        return self.review_business.get_user_reviews(target_user_id, page, page_size)

    def ActionYeyouReviewActivityGet(self, request: Request,
                                      activity_id: int = Query(..., description="活动ID"),
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量")):
        """
        获取活动评价接口
        GET /api/yeyou/review/activity/get
        获取指定活动的所有评价
        """
        return self.review_business.get_activity_reviews(activity_id, page, page_size)

    def ActionYeyouReviewPendingGet(self, request: Request,
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取待评价列表接口
        GET /api/yeyou/review/pending/get
        获取当前用户需要评价的活动和队友列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_my_pending_reviews(user.get('id'), page, page_size)
