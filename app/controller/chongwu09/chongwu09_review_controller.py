from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    service_id: int = Field(..., description="服务ID")
    order_id: int = Field(..., description="订单ID")
    rating: int = Field(..., description="评分1-5")
    content: Optional[str] = Field('', description="评价内容")


class Chongwu09ReviewController:
    def __init__(self):
        from app.business.chongwu09.review_business import ReviewBusiness
        from app.business.chongwu09.user_business import UserBusiness
        from app.business.chongwu09.admin_business import AdminBusiness
        self.review_business = ReviewBusiness()
        self.user_business = UserBusiness()
        self.admin_business = AdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionChongwu09ReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建评价
        POST /api/chongwu09/review/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.create_review(
            user_id=user.get('id'), service_id=body.service_id,
            order_id=body.order_id, rating=body.rating, content=body.content or ''
        )

    def ActionChongwu09ReviewServiceListGet(self, request: Request,
                                             service_id: int = Query(..., description="服务ID"),
                                             page: int = Query(1, ge=1),
                                             page_size: int = Query(10, ge=1, le=100)):
        """
        获取服务评价列表
        GET /api/chongwu09/review/service/list/get
        """
        return self.review_business.get_service_reviews(service_id, page, page_size)

    def ActionChongwu09ReviewMyListGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我的评价列表
        GET /api/chongwu09/review/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.get_my_reviews(user.get('id'), page, page_size)

    def ActionChongwu09ReviewDeletePost(self, request: Request,
                                         review_id: int = Query(..., description="评价ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        删除评价（管理员）
        POST /api/chongwu09/review/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.delete_review(review_id)
