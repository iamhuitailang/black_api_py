from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")
    rating: int = Field(..., description="评分1-5")
    content: Optional[str] = Field(None, description="评价内容")
    is_anonymous: Optional[bool] = Field(False, description="是否匿名")


class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, description="评分1-5")
    content: Optional[str] = Field(None, description="评价内容")
    is_anonymous: Optional[bool] = Field(None, description="是否匿名")


class XuankeReviewController:
    def __init__(self):
        from app.business.xuanke.review_business import XuankeReviewBusiness
        self.review_business = XuankeReviewBusiness()
        from app.business.xuanke.user_business import XuankeUserBusiness
        self.user_business = XuankeUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXuankeReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        创建课程评价接口
        POST /api/xuanke/review/create
        学生对已通过的课程进行评价
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
            course_id=body.course_id,
            rating=body.rating,
            content=body.content or '',
            is_anonymous=body.is_anonymous or False
        )

    def ActionXuankeReviewCourseReviewsGet(self, request: Request,
                                         course_id: int = Query(..., description="课程ID"),
                                         page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取课程评价接口
        GET /api/xuanke/review/course/reviews/get
        获取某门课程的评价列表
        """
        return self.review_business.get_course_reviews(course_id, page, page_size)

    def ActionXuankeReviewMyReviewsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的评价接口
        GET /api/xuanke/review/myreviews/get
        获取当前用户的评价列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_my_reviews(user_id=user.get('id'))

    def ActionXuankeReviewUpdatePost(self, request: Request, body: UpdateReviewRequest,
                                   review_id: int = Query(..., description="评价ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        更新评价接口
        POST /api/xuanke/review/update
        更新自己的课程评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.update_review(
            review_id=review_id,
            user_id=user.get('id'),
            rating=body.rating,
            content=body.content,
            is_anonymous=body.is_anonymous
        )

    def ActionXuankeReviewDeletePost(self, request: Request, review_id: int = Query(..., description="评价ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除评价接口
        POST /api/xuanke/review/delete
        删除自己的课程评价
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
            review_id=review_id,
            user_id=user.get('id')
        )

    def ActionXuankeReviewListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                course_id: Optional[int] = Query(None, description="课程ID"),
                                status: Optional[int] = Query(None, description="状态"),
                                authorization: Optional[str] = Header(None)):
        """
        获取评价列表接口
        GET /api/xuanke/review/list/get
        管理员获取所有评价列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.review_business.get_review_list(page, page_size, course_id, status)

    def ActionXuankeReviewStatusUpdatePost(self, request: Request,
                                         review_id: int = Query(..., description="评价ID"),
                                         status: int = Query(..., description="状态"),
                                         authorization: Optional[str] = Header(None)):
        """
        更新评价状态接口
        POST /api/xuanke/review/status/update
        管理员更新评价状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.review_business.update_review_status(review_id, status)
