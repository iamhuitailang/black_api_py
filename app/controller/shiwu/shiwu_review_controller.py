from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ShiwuReviewController:
    def __init__(self):
        from app.business.shiwu.review_business import ReviewBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.review_business = ReviewBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShiwuReviewByPostGet(self, request: Request,
                                    post_id: int = Query(..., description="信息ID"),
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取某信息的评价列表接口
        GET /api/shiwu/review/by/post/get
        分页获取某信息相关的评价
        """
        return self.review_business.get_reviews_by_post(
            post_id=post_id,
            page=page,
            page_size=page_size
        )

    def ActionShiwuReviewByUserGet(self, request: Request,
                                    user_id: int = Query(..., description="用户ID"),
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    related_type: Optional[str] = Query(None, description="关联类型")):
        """
        获取用户收到的评价列表接口
        GET /api/shiwu/review/by/user/get
        分页获取某用户收到的评价
        """
        return self.review_business.get_reviews_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            related_type=related_type
        )

    def ActionShiwuReviewMyListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    related_type: Optional[str] = Query(None, description="关联类型"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我发出的评价列表接口
        GET /api/shiwu/review/my/list/get
        获取当前用户发出的评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_my_reviews(
            reviewer_id=user.get('id'),
            page=page,
            page_size=page_size,
            related_type=related_type
        )

    def ActionShiwuReviewRatingGet(self, request: Request,
                                   user_id: int = Query(..., description="用户ID")):
        """
        获取用户评分接口
        GET /api/shiwu/review/rating/get
        获取用户的平均评分和评价数量
        """
        return self.review_business.get_user_rating(user_id)

    def ActionShiwuReviewDeletePost(self, request: Request,
                                     review_id: int = Query(..., description="评价ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除评价接口
        POST /api/shiwu/review/delete
        删除自己发出的评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.delete_review(
            reviewer_id=user.get('id'),
            review_id=review_id
        )
