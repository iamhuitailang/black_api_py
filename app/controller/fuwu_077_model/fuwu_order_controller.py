from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    service_id: int = Field(..., description="服务ID")
    appointment_date: str = Field(..., description="预约日期")
    appointment_time: str = Field(..., description="预约时间")
    address: str = Field(..., description="服务地址")
    contact_name: str = Field(..., description="联系人姓名")
    contact_phone: str = Field(..., description="联系电话")
    remarks: Optional[str] = Field('', description="备注")


class AssignStaffRequest(BaseModel):
    staff_id: int = Field(..., description="服务人员ID")


class FuwuOrderController:
    def __init__(self):
        from app.business.fuwu_077_model.order_business import OrderBusiness
        from app.business.fuwu_077_model.auth_business import AuthBusiness
        from app.business.fuwu_077_model.admin_auth_business import AdminAuthBusiness
        self.order_business = OrderBusiness()
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

    def ActionFuwu077ModelOrderCreatePost(self, request: Request, body: CreateOrderRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        创建订单接口
        POST /api/fuwu_077_model/order/create
        用户预约服务，创建订单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.create_order(
            user_id=user.get('id'),
            service_id=body.service_id,
            appointment_time=f"{body.appointment_date} {body.appointment_time}",
            address=body.address,
            contact_name=body.contact_name,
            contact_phone=body.contact_phone,
            remark=body.remarks or ''
        )

    def ActionFuwu077ModelOrderMyGet(self, request: Request,
                              page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量"),
                              status: Optional[str] = Query(None, description="订单状态"),
                              authorization: Optional[str] = Header(None)):
        """
        获取我的订单接口
        GET /api/fuwu_077_model/order/my/get
        用户获取自己的订单列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        status_int = None
        if status:
            try:
                status_int = int(status)
            except (ValueError, TypeError):
                pass

        return self.order_business.get_user_orders(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status_int
        )

    def ActionFuwu077ModelOrderListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                status: Optional[str] = Query(None, description="订单状态"),
                                keyword: Optional[str] = Query(None, description="关键词"),
                                authorization: Optional[str] = Header(None)):
        """
        获取所有订单接口
        GET /api/fuwu_077_model/order/list/get
        管理员获取所有订单列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        status_int = None
        if status:
            try:
                status_int = int(status)
            except (ValueError, TypeError):
                pass

        return self.order_business.get_order_list(
            page=page,
            page_size=page_size,
            status=status_int,
            keyword=keyword
        )

    def ActionFuwu077ModelOrderDetailGet(self, request: Request,
                                  order_id: int = Query(..., description="订单ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取订单详情接口
        GET /api/fuwu_077_model/order/detail/get
        根据订单ID获取订单详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        admin = self._get_current_admin(token)

        if not user and not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        user_id = user.get('id') if user else None

        return self.order_business.get_order_detail(order_id, user_id)

    def ActionFuwu077ModelOrderAssignPost(self, request: Request, body: AssignStaffRequest,
                                   order_id: int = Query(..., description="订单ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        派单接口
        POST /api/fuwu_077_model/order/assign
        管理员为订单分配服务人员
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.order_business.assign_staff(order_id, body.staff_id)

    def ActionFuwu077ModelOrderConfirmPost(self, request: Request,
                                    order_id: int = Query(..., description="订单ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        用户确认订单完成接口
        POST /api/fuwu_077_model/order/confirm
        用户确认服务完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.user_confirm(order_id, user.get('id'))

    def ActionFuwu077ModelOrderCancelPost(self, request: Request,
                                   order_id: int = Query(..., description="订单ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        取消订单接口
        POST /api/fuwu_077_model/order/cancel
        用户取消订单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.cancel_order(order_id, user.get('id'))

    def ActionFuwu077ModelOrderUpcomingGet(self, request: Request,
                                    hours: int = Query(24, description="查询未来多少小时的订单"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取即将到来的订单接口
        GET /api/fuwu_077_model/order/upcoming/get
        管理员获取即将到来的订单
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录管理员账号',
                'data': None
            }

        return self.order_business.get_upcoming_orders(hours)
