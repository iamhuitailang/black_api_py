from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    title: str = Field(..., description="消息标题")
    content: Optional[str] = Field('', description="消息内容")
    message_type: Optional[str] = Field('system', description="消息类型")


class JieyongMessageController:
    def __init__(self):
        from app.business.jieyong_model.message_business import JieyongMessageBusiness
        from app.business.jieyong_model.auth_business import JieyongAuthBusiness
        self.message_business = JieyongMessageBusiness()
        self.auth_business = JieyongAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def _require_admin(self, token: str) -> Optional[dict]:
        user = self._get_current_user(token)
        if not user:
            return None
        if not self.auth_business.is_admin(user.get('id')):
            return None
        return user

    def ActionJieyongMessageMyGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  message_type: Optional[str] = Query(None, description="消息类型"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的消息列表接口
        GET /api/jieyong_model/message/my/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.get_my_messages(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            message_type=message_type
        )

    def ActionJieyongMessageDetailGet(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取消息详情接口
        GET /api/jieyong_model/message/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.get_by_id(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionJieyongMessageReadPost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        标记消息已读接口
        POST /api/jieyong_model/message/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.mark_as_read(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionJieyongMessageReadAllPost(self, request: Request,
                                   authorization: Optional[str] = Header(None)):
        """
        标记所有消息已读接口
        POST /api/jieyong_model/message/read/all
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.mark_all_as_read(user_id=user.get('id'))
    def ActionJieyongMessageDeletePost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        删除消息接口
        POST /api/jieyong_model/message/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.delete(
            message_id=message_id,
            user_id=user.get('id'))
    def ActionJieyongMessageUnreadCountGet(self, request: Request,
                                         authorization: Optional[str] = Header(None)):
        """
        获取未读消息数量接口
        GET /api/jieyong_model/message/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.message_business.get_unread_count(user_id=user.get('id'))
    def ActionJieyongMessageSendPost(self, request: Request, body: SendMessageRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发送消息接口（管理员）
        POST /api/jieyong_model/message/send
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.message_business.send_message(
            user_id=body.user_id,
            title=body.title,
            content=body.content or '',
            message_type=body.message_type or 'system'
        )

    def ActionJieyongMessageListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    user_id: Optional[int] = Query(None, description="用户ID"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    message_type: Optional[str] = Query(None, description="消息类型"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取消息列表接口（管理员）
        GET /api/jieyong_model/message/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._require_admin(token)
        if not admin:
            return {'code': 1, 'msg': '无权限访问', 'data': None}

        return self.message_business.get_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            status=status,
            message_type=message_type
        )
