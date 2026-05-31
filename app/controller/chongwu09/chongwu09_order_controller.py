from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class OrderIdRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")


class OrderProcessRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    status: int = Field(..., description="目标状态")


class Chongwu09OrderController:
    def __init__(self):
        from app.business.chongwu09.order_business import OrderBusiness
        from app.business.chongwu09.user_business import UserBusiness
        from app.business.chongwu09.admin_business import AdminBusiness
        self.order_business = OrderBusiness()
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

    def ActionChongwu09OrderMyListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       status: Optional[int] = Query(None),
                                       authorization: Optional[str] = Header(None)):
        """
        获取我的订单列表
        GET /api/chongwu09/order/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.order_business.get_my_orders(user.get('id'), page, page_size, status)

    def ActionChongwu09OrderPayPost(self, request: Request, body: OrderIdRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        支付订单
        POST /api/chongwu09/order/pay
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.order_business.pay_order(body.order_id, user.get('id'))

    def ActionChongwu09OrderCancelPost(self, request: Request, body: OrderIdRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        取消订单
        POST /api/chongwu09/order/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.order_business.cancel_order(body.order_id, user.get('id'))

    def ActionChongwu09OrderAdminListGet(self, request: Request,
                                          page: int = Query(1, ge=1),
                                          page_size: int = Query(10, ge=1, le=100),
                                          status: Optional[int] = Query(None),
                                          keyword: Optional[str] = Query(None),
                                          authorization: Optional[str] = Header(None)):
        """
        管理员获取订单列表
        GET /api/chongwu09/order/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.order_business.get_all_orders(page, page_size, status, keyword)

    def ActionChongwu09OrderProcessPost(self, request: Request, body: OrderProcessRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        管理员处理订单
        POST /api/chongwu09/order/process
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.order_business.process_order(body.order_id, body.status)
