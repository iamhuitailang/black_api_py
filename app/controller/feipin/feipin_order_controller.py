from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    category_id: int = Field(..., description="废品种类ID")
    weight: float = Field(..., description="预估重量（公斤）")
    address: str = Field(..., description="详细地址")
    contact_name: Optional[str] = Field('', description="联系人姓名")
    contact_phone: Optional[str] = Field('', description="联系电话")
    photos: Optional[List[str]] = Field(default_factory=list, description="照片URL列表")
    schedule_time: Optional[str] = Field('', description="预约时间")
    note: Optional[str] = Field('', description="备注")


class FeipinOrderController:
    def __init__(self):
        from app.business.feipin.order_business import FeipinOrderBusiness
        self.order_business = FeipinOrderBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.feipin.user_business import FeipinUserBusiness
        user_business = FeipinUserBusiness()
        return user_business.verify_token(token)

    def ActionFeipinOrderCreatePost(self, request: Request, body: CreateOrderRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        创建订单接口
        POST /api/feipin/order/create
        用户发布废品回收订单
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
            category_id=body.category_id,
            weight=body.weight,
            address=body.address,
            contact_name=body.contact_name or '',
            contact_phone=body.contact_phone or user.get('phone', ''),
            photos=body.photos or [],
            schedule_time=body.schedule_time or '',
            note=body.note or ''
        )

    def ActionFeipinOrderDetailGet(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取订单详情接口
        GET /api/feipin/order/detail/get
        根据订单ID获取订单详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_order_by_id(order_id)

    def ActionFeipinOrderUserGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[str] = Query(None, description="订单状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户订单列表接口
        GET /api/feipin/order/user/get
        获取当前用户的订单列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_user_orders(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionFeipinOrderCollectorGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[str] = Query(None, description="订单状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取回收员订单列表接口
        GET /api/feipin/order/collector/get
        获取当前回收员的订单列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_collector_orders(
            collector_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionFeipinOrderPendingGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取待接单订单列表接口
        GET /api/feipin/order/pending/get
        获取所有待接单的订单（回收员端）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_pending_orders(page=page, page_size=page_size)

    def ActionFeipinOrderListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[str] = Query(None, description="订单状态"),
                                   keyword: Optional[str] = Query(None, description="关键词搜索")):
        """
        获取所有订单列表接口（管理端）
        GET /api/feipin/order/list/get
        管理端获取所有订单列表
        """
        return self.order_business.get_all_orders(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionFeipinOrderAcceptPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        接单接口
        POST /api/feipin/order/accept
        回收员接单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.accept_order(
            order_id=order_id,
            collector_id=user.get('id')
        )

    def ActionFeipinOrderCompletePost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                        actual_price: Optional[float] = Query(None, description="实际价格"),
                                        authorization: Optional[str] = Header(None)):
        """
        完成订单接口
        POST /api/feipin/order/complete
        回收员确认完成订单
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.complete_order(
            order_id=order_id,
            collector_id=user.get('id'),
            actual_price=actual_price
        )

    def ActionFeipinOrderCancelPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        取消订单接口
        POST /api/feipin/order/cancel
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

        return self.order_business.cancel_order(
            order_id=order_id,
            user_id=user.get('id')
        )

    def ActionFeipinOrderIncomeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取收入统计接口
        GET /api/feipin/order/income/get
        获取当前用户的累计收入
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_user_income(user_id=user.get('id'))

    def ActionFeipinOrderCollectorIncomeGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取回收员收入接口
        GET /api/feipin/order/collector/income/get
        获取当前回收员的累计收入
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_collector_income(collector_id=user.get('id'))

    def ActionFeipinOrderCollectorStatsGet(self, request: Request, year: Optional[int] = Query(None, description="年份"),
                                             month: Optional[int] = Query(None, description="月份"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取回收员月度业绩接口
        GET /api/feipin/order/collector/stats/get
        获取当前回收员的月度业绩统计
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_collector_monthly_stats(
            collector_id=user.get('id'),
            year=year,
            month=month
        )

    def ActionFeipinOrderStatisticsGet(self, request: Request):
        """
        获取订单统计接口
        GET /api/feipin/order/statistics/get
        管理端获取订单统计数据
        """
        return self.order_business.get_statistics()
