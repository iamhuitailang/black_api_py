from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    exchange_id: int = Field(..., description="交换记录ID")
    score: int = Field(5, description="评分：1-5分")
    content: Optional[str] = Field('', description="评价内容")


class JnReviewController:
    def __init__(self):
        from app.business.jn.review_business import JnReviewBusiness
        from app.business.jn.user_business import JnUserBusiness
        self.review_business = JnReviewBusiness()
        self.user_business = JnUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJnReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/jn/review/create
        用户对已完成的交换进行评价
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
            user_id=user.get('id'),
            exchange_id=body.exchange_id,
            score=body.score,
            content=body.content or ''
        )

    def ActionJnReviewUserGet(self, request: Request,
                                user_id: int = Query(..., description="用户ID"),
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取用户评价列表接口
        GET /api/jn/review/user/get
        获取指定用户收到的评价列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_user_reviews(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

    def ActionJnReviewRatingGet(self, request: Request,
                                  user_id: int = Query(..., description="用户ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取用户评分接口
        GET /api/jn/review/rating/get
        获取指定用户的平均评分和评价数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_user_rating(user_id)

    def ActionJnReviewExchangeGet(self, request: Request,
                                    exchange_id: int = Query(..., description="交换记录ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取交换评价接口
        GET /api/jn/review/exchange/get
        获取指定交换记录的所有评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_exchange_reviews(exchange_id)
