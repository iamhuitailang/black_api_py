from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    score: int = Field(5, description="评分 1-5")
    content: Optional[str] = Field('', description="评价内容")


class FeipinReviewController:
    def __init__(self):
        from app.business.feipin.review_business import FeipinReviewBusiness
        self.review_business = FeipinReviewBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.feipin.user_business import FeipinUserBusiness
        user_business = FeipinUserBusiness()
        return user_business.verify_token(token)

    def ActionFeipinReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/feipin/review/create
        用户对回收员进行评价
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
            order_id=body.order_id,
            user_id=user.get('id'),
            score=body.score,
            content=body.content or ''
        )

    def ActionFeipinReviewOrderGet(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取订单评价接口
        GET /api/feipin/review/order/get
        根据订单ID获取评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_review_by_order_id(order_id)

    def ActionFeipinReviewDetailGet(self, request: Request, review_id: int = Query(..., description="评价ID")):
        """
        获取评价详情接口
        GET /api/feipin/review/detail/get
        根据评价ID获取评价详情
        """
        return self.review_business.get_review_by_id(review_id)

    def ActionFeipinReviewCollectorGet(self, request: Request, collector_id: int = Query(..., description="回收员ID"),
                                         page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量")):
        """
        获取回收员评价列表接口
        GET /api/feipin/review/collector/get
        获取指定回收员的所有评价
        """
        return self.review_business.get_collector_reviews(
            collector_id=collector_id,
            page=page,
            page_size=page_size
        )

    def ActionFeipinReviewRatingGet(self, request: Request, collector_id: int = Query(..., description="回收员ID")):
        """
        获取回收员评分接口
        GET /api/feipin/review/rating/get
        获取回收员的平均评分和评价数量
        """
        return self.review_business.get_collector_rating(collector_id)
