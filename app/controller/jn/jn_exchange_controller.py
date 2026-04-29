from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateExchangeRequest(BaseModel):
    to_user: int = Field(..., description="目标用户ID")
    offer_skill_id: int = Field(..., description="提供的技能ID")
    need_skill_id: int = Field(..., description="想学的技能ID")
    message: Optional[str] = Field('', description="邀请留言")


class JnExchangeController:
    def __init__(self):
        from app.business.jn.exchange_business import JnExchangeBusiness
        from app.business.jn.user_business import JnUserBusiness
        self.exchange_business = JnExchangeBusiness()
        self.user_business = JnUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJnExchangeCreatePost(self, request: Request, body: CreateExchangeRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发起交换邀请接口
        POST /api/jn/exchange/create
        对匹配的人发起交换邀请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.create_exchange(
            from_user=user.get('id'),
            to_user=body.to_user,
            offer_skill_id=body.offer_skill_id,
            need_skill_id=body.need_skill_id,
            message=body.message or ''
        )

    def ActionJnExchangeAcceptPost(self, request: Request,
                                     exchange_id: int = Query(..., description="交换记录ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        接受交换邀请接口
        POST /api/jn/exchange/accept
        接受对方的交换邀请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.accept_exchange(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )

    def ActionJnExchangeRejectPost(self, request: Request,
                                     exchange_id: int = Query(..., description="交换记录ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        拒绝交换邀请接口
        POST /api/jn/exchange/reject
        拒绝对方的交换邀请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.reject_exchange(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )

    def ActionJnExchangeStartPost(self, request: Request,
                                    exchange_id: int = Query(..., description="交换记录ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        开始交换接口
        POST /api/jn/exchange/start
        双方确认后开始交换
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.start_exchange(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )

    def ActionJnExchangeCompletePost(self, request: Request,
                                       exchange_id: int = Query(..., description="交换记录ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        完成交换接口
        POST /api/jn/exchange/complete
        确认交换完成
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.complete_exchange(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )

    def ActionJnExchangeCancelPost(self, request: Request,
                                     exchange_id: int = Query(..., description="交换记录ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        取消交换接口
        POST /api/jn/exchange/cancel
        发起方取消交换邀请
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.cancel_exchange(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )

    def ActionJnExchangeMyGet(self, request: Request,
                                status: Optional[str] = Query(None, description="交换状态"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的交换列表接口
        GET /api/jn/exchange/my/get
        获取当前用户的所有交换记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.get_user_exchanges(
            user_id=user.get('id'),
            status=status
        )

    def ActionJnExchangeDetailGet(self, request: Request,
                                    exchange_id: int = Query(..., description="交换记录ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取交换详情接口
        GET /api/jn/exchange/detail/get
        根据ID获取交换详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.exchange_business.get_exchange_detail(
            user_id=user.get('id'),
            exchange_id=exchange_id
        )
