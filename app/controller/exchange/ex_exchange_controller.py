from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateExchangeRequest(BaseModel):
    receiver_item_id: int = Field(..., description="对方物品ID")
    requester_item_id: int = Field(..., description="我的物品ID")
    message: str = Field(default='', description="附言")


class SubmitReviewRequest(BaseModel):
    exchange_id: int = Field(..., description="交换记录ID")
    description_score: int = Field(..., description="物品描述相符度(1-5)")
    attitude_score: int = Field(..., description="沟通态度(1-5)")
    efficiency_score: int = Field(..., description="交换效率(1-5)")
    comment: str = Field(default='', description="评语")


class SimpleIdRequest(BaseModel):
    exchange_id: int = Field(..., description="交换记录ID")


class MessageIdRequest(BaseModel):
    message_id: int = Field(..., description="消息ID")


class ExExchangeController:
    def __init__(self):
        from app.business.exchange import ExExchangeBusiness, ExMessageBusiness
        self.exchange_business = ExExchangeBusiness()
        self.message_business = ExMessageBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        
        token = request.query_params.get('token')
        if token:
            return token
        
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.exchange import ExUserBusiness
        user_business = ExUserBusiness()
        return user_business.verify_token(token)

    def ActionExExchangeCreatePost(self, request: Request, body: CreateExchangeRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发起交换请求接口
        POST /api/ex/exchange/create
        对他人物品发起交换请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.create_request(
            requester_id=user.get('id'),
            receiver_item_id=body.receiver_item_id,
            requester_item_id=body.requester_item_id,
            message=body.message
        )

    def ActionExExchangeSentListGet(self, request: Request,
                                      status: int = Query(None, description="状态"),
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我发起的交换请求列表接口
        GET /api/ex/exchange/sent/list/get
        获取我发起的交换请求列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.get_sent_requests(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExExchangeReceivedListGet(self, request: Request,
                                          status: int = Query(None, description="状态"),
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取我收到的交换请求列表接口
        GET /api/ex/exchange/received/list/get
        获取我收到的交换请求列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.get_received_requests(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionExExchangeDetailGet(self, request: Request,
                                    exchange_id: int = Query(..., description="交换记录ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取交换详情接口
        GET /api/ex/exchange/detail/get
        获取交换请求详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.get_detail(
            exchange_id=exchange_id,
            user_id=user.get('id')
        )

    def ActionExExchangeAgreePost(self, request: Request, body: SimpleIdRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        同意交换请求接口
        POST /api/ex/exchange/agree
        同意收到的交换请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.agree_request(
            exchange_id=body.exchange_id,
            user_id=user.get('id')
        )

    def ActionExExchangeRejectPost(self, request: Request, body: SimpleIdRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        拒绝交换请求接口
        POST /api/ex/exchange/reject
        拒绝收到的交换请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.reject_request(
            exchange_id=body.exchange_id,
            user_id=user.get('id')
        )

    def ActionExExchangeCancelPost(self, request: Request, body: SimpleIdRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        取消交换请求接口
        POST /api/ex/exchange/cancel
        取消自己发起的交换请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.cancel_request(
            exchange_id=body.exchange_id,
            user_id=user.get('id')
        )

    def ActionExExchangeCompletePost(self, request: Request, body: SimpleIdRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        确认交换完成接口
        POST /api/ex/exchange/complete
        双方确认交换完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.confirm_complete(
            exchange_id=body.exchange_id,
            user_id=user.get('id')
        )

    def ActionExExchangeReviewPost(self, request: Request, body: SubmitReviewRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        提交评价接口
        POST /api/ex/exchange/review
        交换完成后提交评价
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.submit_review(
            exchange_id=body.exchange_id,
            reviewer_id=user.get('id'),
            description_score=body.description_score,
            attitude_score=body.attitude_score,
            efficiency_score=body.efficiency_score,
            comment=body.comment
        )

    def ActionExExchangeHistoryGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取交换历史接口
        GET /api/ex/exchange/history/get
        获取已完成的交换历史记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.get_completed_history(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionExExchangeMyReviewsGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取我的评价接口
        GET /api/ex/exchange/my/reviews/get
        获取他人对我的评价列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.exchange_business.get_my_reviews(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionExMessageListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(20, ge=1, le=100, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取消息列表接口
        GET /api/ex/message/list/get
        获取我的消息列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.message_business.get_my_messages(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionExMessageUnreadCountGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        获取未读消息数量接口
        GET /api/ex/message/unread/count/get
        获取未读消息数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.message_business.get_unread_count(user_id=user.get('id'))

    def ActionExMessageReadPost(self, request: Request, body: MessageIdRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        标记消息已读接口
        POST /api/ex/message/read
        标记单条消息为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.message_business.mark_as_read(
            message_id=body.message_id,
            user_id=user.get('id')
        )

    def ActionExMessageReadAllPost(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        """
        标记所有消息已读接口
        POST /api/ex/message/read/all
        标记所有消息为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        
        return self.message_business.mark_all_read(user_id=user.get('id'))
