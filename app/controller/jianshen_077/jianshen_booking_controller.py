from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBookingRequest(BaseModel):
    course_id: int = Field(..., description="课程ID")
    remark: Optional[str] = Field('', description="备注")


class CancelBookingRequest(BaseModel):
    booking_id: int = Field(..., description="预约ID")


class UpdateBookingStatusRequest(BaseModel):
    booking_id: int = Field(..., description="预约ID")
    status: int = Field(..., description="状态")


class JianshenBookingController:
    def __init__(self):
        from app.business.jianshen_077.booking_business import BookingBusiness
        self.booking_business = BookingBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        return JianshenAuthBusiness().verify_token(token)

    def ActionJianshenBookingCreatePost(self, request: Request, body: CreateBookingRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        预约课程接口
        POST /api/jianshen/booking/create
        用户预约课程
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booking_business.create_booking(
            user_id=user.get('id'),
            course_id=body.course_id,
            remark=body.remark or ''
        )

    def ActionJianshenBookingCancelPost(self, request: Request, body: CancelBookingRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        取消预约接口
        POST /api/jianshen/booking/cancel
        用户取消课程预约
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booking_business.cancel_booking(
            booking_id=body.booking_id,
            user_id=user.get('id')
        )

    def ActionJianshenBookingMyListGet(self, request: Request,
                                        page: int = Query(1, ge=1, description="页码"),
                                        page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我的预约列表接口
        GET /api/jianshen/booking/my/list/get
        用户查看自己的预约记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booking_business.get_my_bookings(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJianshenBookingCourseListGet(self, request: Request,
                                            course_id: int = Query(..., description="课程ID"),
                                            page: int = Query(1, ge=1, description="页码"),
                                            page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                            status: Optional[int] = Query(None, description="状态"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取课程预约列表接口
        GET /api/jianshen/booking/course/list/get
        管理员查看课程预约列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.booking_business.get_course_bookings(
            course_id=course_id,
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJianshenBookingAllListGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         keyword: Optional[str] = Query(None, description="搜索关键词"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取所有预约列表接口
        GET /api/jianshen/booking/all/list/get
        管理员查看所有预约记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.booking_business.get_all_bookings(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionJianshenBookingStatusUpdatePost(self, request: Request, body: UpdateBookingStatusRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        更新预约状态接口
        POST /api/jianshen/booking/status/update
        管理员更新预约状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.booking_business.update_booking_status(body.booking_id, body.status)
