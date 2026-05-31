from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    rating: int = Field(5, description="评分 1-5")
    content: Optional[str] = Field('', description="评价内容")
    images: Optional[str] = Field('', description="评价图片")


class FuwuReviewController:
    def __init__(self):
        from app.business.fuwu_077_model.review_business import ReviewBusiness
        from app.business.fuwu_077_model.auth_business import AuthBusiness
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.review_business = ReviewBusiness()
        self.auth_business = AuthBusiness()
        self.admin_auth_business = AdminAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_auth_business.verify_token(token)

    def ActionFuwu077ModelReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/fuwu_077_model/review/create
        用户对已完成的订单进行评价
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
            rating=body.rating,
            content=body.content or '',
            images=body.images or ''
        )

    def ActionFuwu077ModelReviewMyGet(self, request: Request,
                               page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               authorization: Optional[str] = Header(None)):
        """
        获取我的评价接口
        GET /api/fuwu_077_model/review/my/get
        用户获取自己的评价列表
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
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionFuwu077ModelReviewListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                staff_id: Optional[int] = Query(None, description="服务人员ID"),
                                service_id: Optional[int] = Query(None, description="服务ID"),
                                min_rating: Optional[int] = Query(None, description="最低评分"),
                                max_rating: Optional[int] = Query(None, description="最高评分")):
        """
        获取评价列表接口
        GET /api/fuwu_077_model/review/list/get
        分页获取评价列表，支持按服务人员、服务、评分筛选
        """
        return self.review_business.get_review_list(
            page=page,
            page_size=page_size,
            staff_id=staff_id,
            service_id=service_id,
            min_rating=min_rating,
            max_rating=max_rating
        )

    def ActionFuwu077ModelReviewStaffGet(self, request: Request,
                                  staff_id: int = Query(..., description="服务人员ID"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取服务人员评价接口
        GET /api/fuwu_077_model/review/staff/get
        获取指定服务人员的所有评价
        """
        return self.review_business.get_staff_reviews(
            staff_id=staff_id,
            page=page,
            page_size=page_size
        )

    def ActionFuwu077ModelReviewServiceGet(self, request: Request,
                                    service_id: int = Query(..., description="服务ID"),
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量")):
        """
        获取服务评价接口
        GET /api/fuwu_077_model/review/service/get
        获取指定服务的所有评价
        """
        return self.review_business.get_service_reviews(
            service_id=service_id,
            page=page,
            page_size=page_size
        )

    def ActionFuwu077ModelReviewDetailGet(self, request: Request,
                                   review_id: int = Query(..., description="评价ID")):
        """
        获取评价详情接口
        GET /api/fuwu_077_model/review/detail/get
        根据ID获取评价详情
        """
        return self.review_business.get_review_detail(review_id)

    def ActionFuwu077ModelReviewDeletePost(self, request: Request,
                                    review_id: int = Query(..., description="评价ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除评价接口
        POST /api/fuwu_077_model/review/delete
        管理员删除评价
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.review_business.delete_review(review_id)
