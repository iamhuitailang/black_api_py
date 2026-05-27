from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    book_id: int = Field(..., description="教材ID")
    receiver_name: Optional[str] = Field(None, description="收货人姓名")
    receiver_phone: Optional[str] = Field(None, description="收货人电话")
    receiver_address: Optional[str] = Field(None, description="收货地址")
    remark: Optional[str] = Field(None, description="备注")


class CreateRefundRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    reason: str = Field(..., description="退款原因")
    description: Optional[str] = Field(None, description="详细描述")
    images: Optional[str] = Field(None, description="图片")


class CreateReportRequest(BaseModel):
    target_type: str = Field(..., description="举报对象类型")
    target_id: int = Field(..., description="举报对象ID")
    type: str = Field(..., description="举报分类")
    reason: Optional[str] = Field(None, description="原因")
    description: Optional[str] = Field(None, description="详细描述")
    images: Optional[str] = Field(None, description="图片")


class CreateAnnouncementRequest(BaseModel):
    title: str = Field(..., description="标题")
    content: Optional[str] = Field(None, description="内容")
    type: Optional[str] = Field('notice', description="类型")
    status: Optional[int] = Field(0, description="状态")
    sort_order: Optional[int] = Field(0, description="排序")


class SendMessageRequest(BaseModel):
    receiver_id: int = Field(..., description="接收者ID")
    book_id: Optional[int] = Field(0, description="教材ID")
    content: str = Field(..., description="消息内容")
    type: Optional[str] = Field('text', description="消息类型")


class JiaoyiTradeController:
    def __init__(self):
        from app.business.jiaoyi import (
            JiaoyiOrderBusiness, JiaoyiAnnouncementBusiness,
            JiaoyiChatBusiness, JiaoyiRefundBusiness,
            JiaoyiReportBusiness, JiaoyiStatisticsBusiness
        )
        self.order_business = JiaoyiOrderBusiness()
        self.announcement_business = JiaoyiAnnouncementBusiness()
        self.chat_business = JiaoyiChatBusiness()
        self.refund_business = JiaoyiRefundBusiness()
        self.report_business = JiaoyiReportBusiness()
        self.statistics_business = JiaoyiStatisticsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jiaoyi import JiaoyiUserBusiness
        user_business = JiaoyiUserBusiness()
        return user_business.verify_token(token)

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.jiaoyi import JiaoyiAdminBusiness
        admin_business = JiaoyiAdminBusiness()
        return admin_business.verify_token(token)

    def ActionJiaoyiOrderCreatePost(self, request: Request, body: CreateOrderRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.create_order(
            buyer_id=user.get('id'),
            book_id=body.book_id,
            receiver_name=body.receiver_name or '',
            receiver_phone=body.receiver_phone or '',
            receiver_address=body.receiver_address or '',
            remark=body.remark or ''
        )

    def ActionJiaoyiOrderDetailGet(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_order_detail(order_id, user.get('id'))

    def ActionJiaoyiOrderBuyerListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_buyer_orders(user.get('id'), page, page_size, status)

    def ActionJiaoyiOrderSellerListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_seller_orders(user.get('id'), page, page_size, status)

    def ActionJiaoyiOrderAllListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     keyword: Optional[str] = Query(None, description="关键词"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.get_all_orders(page, page_size, status, keyword)

    def ActionJiaoyiOrderPayPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.pay_order(order_id, user.get('id'))

    def ActionJiaoyiOrderShipPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.ship_order(order_id, user.get('id'))

    def ActionJiaoyiOrderReceivePost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.receive_order(order_id, user.get('id'))

    def ActionJiaoyiOrderCompletePost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.complete_order(order_id, user.get('id'))

    def ActionJiaoyiOrderCancelPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                     reason: Optional[str] = Query(None, description="取消原因"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.order_business.cancel_order(order_id, user.get('id'), reason or '')

    def ActionJiaoyiAnnouncementListGet(self, request: Request, page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         type: Optional[str] = Query(None, description="类型")):
        return self.announcement_business.get_announcement_list(page, page_size, status=1, type=type)

    def ActionJiaoyiAnnouncementAllGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[int] = Query(None, description="状态"),
                                        type: Optional[str] = Query(None, description="类型"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.announcement_business.get_announcement_list(page, page_size, status, type)

    def ActionJiaoyiAnnouncementDetailGet(self, request: Request, announcement_id: int = Query(..., description="公告ID")):
        return self.announcement_business.get_announcement_detail(announcement_id)

    def ActionJiaoyiAnnouncementCreatePost(self, request: Request, body: CreateAnnouncementRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.announcement_business.create_announcement(
            title=body.title,
            content=body.content or '',
            type=body.type or 'notice',
            status=body.status or 0,
            sort_order=body.sort_order or 0
        )

    def ActionJiaoyiAnnouncementUpdatePost(self, request: Request, announcement_id: int = Query(..., description="公告ID"),
                                            title: Optional[str] = Query(None, description="标题"),
                                            content: Optional[str] = Query(None, description="内容"),
                                            type: Optional[str] = Query(None, description="类型"),
                                            status: Optional[int] = Query(None, description="状态"),
                                            sort_order: Optional[int] = Query(None, description="排序"),
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if title is not None:
            data['title'] = title
        if content is not None:
            data['content'] = content
        if type is not None:
            data['type'] = type
        if status is not None:
            data['status'] = status
        if sort_order is not None:
            data['sort_order'] = sort_order

        return self.announcement_business.update_announcement(announcement_id, data)

    def ActionJiaoyiAnnouncementDeletePost(self, request: Request, announcement_id: int = Query(..., description="公告ID"),
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.announcement_business.delete_announcement(announcement_id)

    def ActionJiaoyiChatSendPost(self, request: Request, body: SendMessageRequest,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.chat_business.send_message(
            sender_id=user.get('id'),
            receiver_id=body.receiver_id,
            book_id=body.book_id or 0,
            content=body.content,
            type=body.type or 'text'
        )

    def ActionJiaoyiChatConversationGet(self, request: Request, other_id: int = Query(..., description="对方ID"),
                                         book_id: Optional[int] = Query(0, description="教材ID"),
                                         page: int = Query(1, description="页码"),
                                         page_size: int = Query(20, description="每页数量"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.chat_business.get_conversation(user.get('id'), other_id, book_id or 0, page, page_size)

    def ActionJiaoyiChatListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.chat_business.get_conversation_list(user.get('id'))

    def ActionJiaoyiRefundCreatePost(self, request: Request, body: CreateRefundRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.create_refund(
            order_id=body.order_id,
            buyer_id=user.get('id'),
            reason=body.reason,
            description=body.description or '',
            images=body.images or ''
        )

    def ActionJiaoyiRefundDetailGet(self, request: Request, refund_id: int = Query(..., description="退款ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.get_refund_detail(refund_id, user.get('id'))

    def ActionJiaoyiRefundListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.get_refund_list(page, page_size, status, buyer_id=user.get('id'))

    def ActionJiaoyiRefundSellerListGet(self, request: Request, page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.get_refund_list(page, page_size, status, seller_id=user.get('id'))

    def ActionJiaoyiRefundAllListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.get_refund_list(page, page_size, status)

    def ActionJiaoyiRefundApprovePost(self, request: Request, refund_id: int = Query(..., description="退款ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.approve_refund(refund_id, user.get('id'))

    def ActionJiaoyiRefundRejectPost(self, request: Request, refund_id: int = Query(..., description="退款ID"),
                                      reason: Optional[str] = Query(None, description="拒绝原因"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.refund_business.reject_refund(refund_id, user.get('id'), reason or '')

    def ActionJiaoyiReportCreatePost(self, request: Request, body: CreateReportRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.create_report(
            reporter_id=user.get('id'),
            target_type=body.target_type,
            target_id=body.target_id,
            type=body.type,
            reason=body.reason or '',
            description=body.description or '',
            images=body.images or ''
        )

    def ActionJiaoyiReportListGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   target_type: Optional[str] = Query(None, description="对象类型"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.get_report_list(page, page_size, status, target_type)

    def ActionJiaoyiReportDetailGet(self, request: Request, report_id: int = Query(..., description="举报ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.get_report_detail(report_id)

    def ActionJiaoyiReportProcessPost(self, request: Request, report_id: int = Query(..., description="举报ID"),
                                        status: int = Query(..., description="状态"),
                                        note: Optional[str] = Query(None, description="处理备注"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.report_business.process_report(report_id, admin.get('id'), status, note or '')

    def ActionJiaoyiStatisticsOverallGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_overall_statistics()

    def ActionJiaoyiStatisticsUserGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_user_statistics(user.get('id'), user.get('role'))

    def ActionJiaoyiStatisticsTrendGet(self, request: Request, days: int = Query(7, description="天数"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_daily_trend(days)

    def ActionJiaoyiStatisticsCategoryGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.statistics_business.get_category_statistics()
