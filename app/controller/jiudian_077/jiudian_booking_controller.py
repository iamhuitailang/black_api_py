from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBookingRequest(BaseModel):
    room_id: int = Field(..., description="房间ID")
    check_in_date: str = Field(..., description="入住日期")
    check_out_date: str = Field(..., description="退房日期")
    guest_name: str = Field(..., description="入住人姓名")
    guest_phone: str = Field(..., description="入住人手机号")
    guest_id_card: Optional[str] = Field('', description="身份证号")
    guests_count: Optional[int] = Field(1, description="入住人数")
    remark: Optional[str] = Field('', description="备注")


class JiudianBookingController:
    def __init__(self):
        from app.business.jiudian_077.user_business import JiudianUserBusiness
        from app.business.jiudian_077.booking_business import JiudianBookingBusiness
        self.user_business = JiudianUserBusiness()
        self.booking_business = JiudianBookingBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _is_admin(self, user: dict) -> bool:
        return user and user.get('role') == 'admin'

    def ActionJiudian077BookingCreatePost(self, request: Request, body: CreateBookingRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        创建预订接口
        POST /api/jiudian_077/booking/create
        用户创建房间预订
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
            room_id=body.room_id,
            check_in_date=body.check_in_date,
            check_out_date=body.check_out_date,
            guest_name=body.guest_name,
            guest_phone=body.guest_phone,
            guest_id_card=body.guest_id_card,
            guests_count=body.guests_count,
            remark=body.remark
        )

    def ActionJiudian077BookingCancelPost(self, request: Request,
                                           booking_id: int = Query(..., description="预订ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        取消预订接口
        POST /api/jiudian_077/booking/cancel
        用户取消自己的预订
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        is_admin = self._is_admin(user)
        return self.booking_business.cancel_booking(
            booking_id=booking_id,
            user_id=user.get('id'),
            is_admin=is_admin
        )

    def ActionJiudian077BookingMyGet(self, request: Request,
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取我的预订接口
        GET /api/jiudian_077/booking/my/get
        获取当前用户的预订列表
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

    def ActionJiudian077BookingListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       user_id: Optional[int] = Query(None, description="用户ID"),
                                       room_id: Optional[int] = Query(None, description="房间ID"),
                                       start_date: Optional[str] = Query(None, description="开始日期"),
                                       end_date: Optional[str] = Query(None, description="结束日期"),
                                       keyword: Optional[str] = Query(None, description="关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取预订列表接口
        GET /api/jiudian_077/booking/list/get
        管理员获取所有预订列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.booking_business.get_booking_list(
            page=page,
            page_size=page_size,
            status=status,
            user_id=user_id,
            room_id=room_id,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword
        )

    def ActionJiudian077BookingDetailGet(self, request: Request,
                                          booking_id: int = Query(..., description="预订ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取预订详情接口
        GET /api/jiudian_077/booking/detail/get
        根据预订ID获取详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        result = self.booking_business.get_booking_by_id(booking_id)
        if result.get('code') == 0:
            booking = result.get('data')
            if not self._is_admin(user) and booking.get('user_id') != user.get('id'):
                return {
                    'code': 1,
                    'msg': '无权查看他人的预订',
                    'data': None
                }

        return result

    def ActionJiudian077BookingConfirmPost(self, request: Request,
                                            booking_id: int = Query(..., description="预订ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        确认预订接口
        POST /api/jiudian_077/booking/confirm
        管理员确认预订
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.booking_business.confirm_booking(booking_id=booking_id)

    def ActionJiudian077BookingCheckInPost(self, request: Request,
                                            booking_id: int = Query(..., description="预订ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        办理入住接口
        POST /api/jiudian_077/booking/check/in
        管理员办理入住
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.booking_business.check_in(booking_id=booking_id)

    def ActionJiudian077BookingCheckOutPost(self, request: Request,
                                             booking_id: int = Query(..., description="预订ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        办理退房接口
        POST /api/jiudian_077/booking/check/out
        管理员办理退房
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.booking_business.check_out(booking_id=booking_id)

    def ActionJiudian077BookingStatusListGet(self, request: Request):
        """
        获取预订状态列表接口
        GET /api/jiudian_077/booking/status/list/get
        获取所有预订状态
        """
        return self.booking_business.get_booking_status_list()

    def ActionJiudian077BookingDeletePost(self, request: Request,
                                           booking_id: int = Query(..., description="预订ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除预订接口
        POST /api/jiudian_077/booking/delete
        管理员删除预订
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.booking_business.delete_booking(booking_id=booking_id)
