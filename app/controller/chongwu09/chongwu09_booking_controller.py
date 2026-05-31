from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBookingRequest(BaseModel):
    service_id: int = Field(..., description="服务ID")
    pet_id: int = Field(..., description="宠物ID")
    start_date: str = Field(..., description="开始日期")
    end_date: str = Field(..., description="结束日期")
    notes: Optional[str] = Field('', description="备注")


class BookingIdRequest(BaseModel):
    booking_id: int = Field(..., description="预约ID")
    admin_notes: Optional[str] = Field('', description="管理员备注")


class Chongwu09BookingController:
    def __init__(self):
        from app.business.chongwu09.booking_business import BookingBusiness
        from app.business.chongwu09.user_business import UserBusiness
        from app.business.chongwu09.admin_business import AdminBusiness
        self.booking_business = BookingBusiness()
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

    def ActionChongwu09BookingCreatePost(self, request: Request, body: CreateBookingRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        创建预约
        POST /api/chongwu09/booking/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.create_booking(
            user_id=user.get('id'), service_id=body.service_id, pet_id=body.pet_id,
            start_date=body.start_date, end_date=body.end_date, notes=body.notes or ''
        )

    def ActionChongwu09BookingMyListGet(self, request: Request,
                                         page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100),
                                         status: Optional[int] = Query(None),
                                         authorization: Optional[str] = Header(None)):
        """
        获取我的预约列表
        GET /api/chongwu09/booking/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.get_my_bookings(user.get('id'), page, page_size, status)

    def ActionChongwu09BookingCancelPost(self, request: Request, body: BookingIdRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        取消预约
        POST /api/chongwu09/booking/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.cancel_booking(body.booking_id, user.get('id'))

    def ActionChongwu09BookingDetailGet(self, request: Request,
                                         booking_id: int = Query(..., description="预约ID")):
        """
        获取预约详情
        GET /api/chongwu09/booking/detail/get
        """
        return self.booking_business.get_booking(booking_id)

    def ActionChongwu09BookingAdminListGet(self, request: Request,
                                            page: int = Query(1, ge=1),
                                            page_size: int = Query(10, ge=1, le=100),
                                            status: Optional[int] = Query(None),
                                            service_id: Optional[int] = Query(None),
                                            keyword: Optional[str] = Query(None),
                                            authorization: Optional[str] = Header(None)):
        """
        管理员获取预约列表
        GET /api/chongwu09/booking/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.get_all_bookings(page, page_size, status, service_id, keyword)

    def ActionChongwu09BookingConfirmPost(self, request: Request, body: BookingIdRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        确认预约
        POST /api/chongwu09/booking/confirm
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.confirm_booking(body.booking_id, body.admin_notes or '')

    def ActionChongwu09BookingStartPost(self, request: Request, body: BookingIdRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        开始寄养
        POST /api/chongwu09/booking/start
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.start_booking(body.booking_id, body.admin_notes or '')

    def ActionChongwu09BookingCompletePost(self, request: Request, body: BookingIdRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        完成寄养
        POST /api/chongwu09/booking/complete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.complete_booking(body.booking_id, body.admin_notes or '')

    def ActionChongwu09BookingRejectPost(self, request: Request, body: BookingIdRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        拒绝预约
        POST /api/chongwu09/booking/reject
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.booking_business.reject_booking(body.booking_id, body.admin_notes or '')
