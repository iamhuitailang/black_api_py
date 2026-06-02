from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.meng import MengFriendBusiness, MengUserBusiness


class AddFriendRequest(BaseModel):
    friend_id: int = Field(..., description="好友用户ID")


class MengFriendController:
    def __init__(self):
        self.friend_business = MengFriendBusiness()
        self.user_business = MengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengFriendAddPost(self, request: Request, body: AddFriendRequest,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.add_friend(
            user_id=user.get('id'),
            friend_id=body.friend_id
        )

    def ActionMengFriendAcceptPost(self, request: Request,
                                    record_id: int = Query(..., description="好友请求记录ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.accept_friend(
            user_id=user.get('id'),
            record_id=record_id
        )

    def ActionMengFriendRejectPost(self, request: Request,
                                    record_id: int = Query(..., description="好友请求记录ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.reject_friend(
            user_id=user.get('id'),
            record_id=record_id
        )

    def ActionMengFriendDeletePost(self, request: Request,
                                    record_id: int = Query(..., description="好友记录ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.delete_friend(
            user_id=user.get('id'),
            record_id=record_id
        )

    def ActionMengFriendListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_friends(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionMengFriendPendingGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.get_pending_requests(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionMengFriendCheckGet(self, request: Request,
                                  friend_id: int = Query(..., description="好友用户ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.friend_business.is_friend(
            user_id=user.get('id'),
            friend_id=friend_id
        )
