from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    title: str = Field(..., description="标题")
    content: str = Field('', description="内容")


class KuaidiMessageController:
    def __init__(self):
        from app.business.kuaidi_077.user_business import KuaidiUserBusiness
        from app.business.kuaidi_077.message_business import KuaidiMessageBusiness
        self.user_business = KuaidiUserBusiness()
        self.message_business = KuaidiMessageBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionKuaidi077MessageDetailGet(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取消息详情接口
        GET /api/kuaidi077/message/detail/get
        根据ID获取消息详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.get_message_by_id(message_id)

    def ActionKuaidi077MessageMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取我的消息接口
        GET /api/kuaidi077/message/my/get
        用户查看自己的消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.get_user_messages(user.get('id'), page, page_size, status)

    def ActionKuaidi077MessageUnreadCountGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取未读消息数接口
        GET /api/kuaidi077/message/unread/count/get
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

        return self.message_business.get_unread_count(user.get('id'))

    def ActionKuaidi077MessageReadPost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        标记消息已读接口
        POST /api/kuaidi077/message/read
        标记消息为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.mark_as_read(message_id, user.get('id'))

    def ActionKuaidi077MessageReadAllPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        标记所有消息已读接口
        POST /api/kuaidi077/message/read/all
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

        return self.message_business.mark_all_as_read(user.get('id'))

    def ActionKuaidi077MessageDeletePost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除消息接口
        POST /api/kuaidi077/message/delete
        删除消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.delete_message(message_id, user.get('id'))

    def ActionKuaidi077MessageListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       user_id: Optional[int] = Query(None, description="用户ID"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       msg_type: Optional[int] = Query(None, description="消息类型"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取消息列表接口
        GET /api/kuaidi077/message/list/get
        管理员获取消息列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.message_business.get_message_list(page, page_size, user_id, status, msg_type)

    def ActionKuaidi077MessageSendPost(self, request: Request, body: SendMessageRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        发送系统消息接口
        POST /api/kuaidi077/message/send
        管理员发送系统消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.message_business.send_system_message(body.user_id, body.title, body.content)
