from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    user_id: int = Field(..., description="接收用户ID")
    title: str = Field(..., description="消息标题")
    content: str = Field(..., description="消息内容")


class JiudianMessageController:
    def __init__(self):
        from app.business.jiudian_077.user_business import JiudianUserBusiness
        from app.business.jiudian_077.message_business import JiudianMessageBusiness
        self.user_business = JiudianUserBusiness()
        self.message_business = JiudianMessageBusiness()

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

    def ActionJiudian077MessageMyGet(self, request: Request,
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     type: Optional[str] = Query(None, description="消息类型"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取我的消息接口
        GET /api/jiudian_077/message/my/get
        获取当前用户的消息列表
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
            page_size=page_size,
            status=status,
            type=type
        )

    def ActionJiudian077MessageDetailGet(self, request: Request,
                                          message_id: int = Query(..., description="消息ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取消息详情接口
        GET /api/jiudian_077/message/detail/get
        根据消息ID获取详情，自动标记为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.get_message_by_id(
            message_id=message_id,
            user_id=user.get('id'),
            is_admin=self._is_admin(user)
        )

    def ActionJiudian077MessageReadPost(self, request: Request,
                                         message_id: int = Query(..., description="消息ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        标记消息已读接口
        POST /api/jiudian_077/message/read
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
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionJiudian077MessageReadAllPost(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        标记所有消息已读接口
        POST /api/jiudian_077/message/read/all
        标记当前用户所有消息为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.mark_all_as_read(user_id=user.get('id'))

    def ActionJiudian077MessageUnreadCountGet(self, request: Request,
                                               authorization: Optional[str] = Header(None)):
        """
        获取未读消息数量接口
        GET /api/jiudian_077/message/unread/count/get
        获取当前用户未读消息数量
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

    def ActionJiudian077MessageDeletePost(self, request: Request,
                                           message_id: int = Query(..., description="消息ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除消息接口
        POST /api/jiudian_077/message/delete
        删除自己的消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.delete_message(
            message_id=message_id,
            user_id=user.get('id'),
            is_admin=self._is_admin(user)
        )

    def ActionJiudian077MessageSendPost(self, request: Request, body: SendMessageRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        发送系统消息接口
        POST /api/jiudian_077/message/send
        管理员给用户发送系统消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.message_business.send_system_message(
            user_id=body.user_id,
            title=body.title,
            content=body.content
        )

    def ActionJiudian077MessageListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       user_id: Optional[int] = Query(None, description="用户ID"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       type: Optional[str] = Query(None, description="消息类型"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取消息列表接口
        GET /api/jiudian_077/message/list/get
        管理员获取所有消息列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not self._is_admin(user):
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.message_business.get_message_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            status=status,
            type=type
        )

    def ActionJiudian077MessageTypesGet(self, request: Request):
        """
        获取消息类型列表接口
        GET /api/jiudian_077/message/types/get
        获取所有消息类型
        """
        return self.message_business.get_message_types()
