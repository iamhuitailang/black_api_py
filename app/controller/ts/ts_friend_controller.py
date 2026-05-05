from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SendRequestRequest(BaseModel):
    phone: str = Field(..., description="好友手机号")


class HandleRequestRequest(BaseModel):
    relationship_id: int = Field(..., description="关系ID")


class TsFriendController:
    def __init__(self):
        from app.business.ts.friend_business import TsFriendBusiness
        self.friend_business = TsFriendBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ts.user_business import TsUserBusiness
        user_business = TsUserBusiness()
        return user_business.verify_token(token)

    def ActionTsFriendRequestPost(self, request: Request, body: SendRequestRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        发送好友请求接口
        POST /api/ts/friend/request
        发送好友请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.send_friend_request(
            user_id=user.get('id'),
            friend_phone=body.phone
        )

    def ActionTsFriendAcceptPost(self, request: Request, body: HandleRequestRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        接受好友请求接口
        POST /api/ts/friend/accept
        接受好友请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.accept_friend_request(
            user_id=user.get('id'),
            relationship_id=body.relationship_id
        )

    def ActionTsFriendRejectPost(self, request: Request, body: HandleRequestRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        拒绝好友请求接口
        POST /api/ts/friend/reject
        拒绝好友请求
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.reject_friend_request(
            user_id=user.get('id'),
            relationship_id=body.relationship_id
        )

    def ActionTsFriendListGet(self, request: Request,
                               authorization: Optional[str] = Header(None)):
        """
        获取好友列表接口
        GET /api/ts/friend/list/get
        获取用户的好友列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_friends(user_id=user.get('id'))

    def ActionTsFriendPendingGet(self, request: Request,
                                  authorization: Optional[str] = Header(None)):
        """
        获取待确认好友请求接口
        GET /api/ts/friend/pending/get
        获取收到的待确认好友请求列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_pending_requests(user_id=user.get('id'))

    def ActionTsFriendSentGet(self, request: Request,
                               authorization: Optional[str] = Header(None)):
        """
        获取已发送好友请求接口
        GET /api/ts/friend/sent/get
        获取已发送的好友请求列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_sent_requests(user_id=user.get('id'))

    def ActionTsFriendRemovePost(self, request: Request,
                                  friend_id: int = Query(..., description="好友ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        删除好友接口
        POST /api/ts/friend/remove
        删除好友关系
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.remove_friend(
            user_id=user.get('id'),
            friend_id=friend_id
        )

    def ActionTsFriendRankingGet(self, request: Request,
                                  period: str = Query('week', description="统计周期: week/month"),
                                  limit: int = Query(10, description="返回数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取好友排行榜接口
        GET /api/ts/friend/ranking/get
        获取好友跳绳排行榜
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_friend_ranking(
            user_id=user.get('id'),
            period=period,
            limit=limit
        )

    def ActionTsFriendSearchGet(self, request: Request,
                                 phone: str = Query(..., description="手机号")):
        """
        搜索用户接口
        GET /api/ts/friend/search/get
        根据手机号搜索用户
        """
        return self.friend_business.search_user(phone=phone)
