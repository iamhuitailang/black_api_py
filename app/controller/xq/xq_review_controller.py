from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    score: int = Field(..., description="评分 1-5分")
    content: Optional[str] = Field(None, description="评价内容")


class XqReviewController:
    def __init__(self):
        from app.business.xq.review_business import XqReviewBusiness
        from app.business.xq.user_business import XqUserBusiness
        self.review_business = XqReviewBusiness()
        self.user_business = XqUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXqReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/xq/review/create
        完成订单后对对方进行评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if body.score < 1 or body.score > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5分之间',
                'data': None
            }

        return self.review_business.create_review(
            user_id=user.get('id'),
            order_id=body.order_id,
            score=body.score,
            content=body.content or ''
        )

    def ActionXqReviewUserListGet(self, request: Request,
                                   user_id: int = Query(..., description="用户ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取用户的评价列表接口
        GET /api/xq/review/user/list/get
        获取某个用户收到的所有评价
        """
        return self.review_business.get_user_reviews(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

    def ActionXqReviewDetailGet(self, request: Request, review_id: int = Query(..., description="评价ID")):
        """
        获取评价详情接口
        GET /api/xq/review/detail/get
        根据评价ID获取详细信息
        """
        return self.review_business.get_review_detail(review_id=review_id)
