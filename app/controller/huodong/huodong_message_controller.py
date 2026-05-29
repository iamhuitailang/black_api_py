from typing import Optional
from fastapi import Request, Header, Query


class HuodongMessageController:
    def __init__(self):
        from app.business.huodong.message_business import MessageBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.message_business = MessageBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongMessageListGet(self, request: Request,
                                     page: int = Query(1, ge=1),
                                     page_size: int = Query(20, ge=1, le=100),
                                     message_type: Optional[str] = Query(None, description="消息类型"),
                                     is_read: Optional[int] = Query(None, description="是否已读"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取消息列表
        GET /api/huodong/message/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.message_business.get_messages(
            user.get('id'), page, page_size, message_type, is_read
        )

    def ActionHuodongMessageUnreadCountGet(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        获取未读消息数量
        GET /api/huodong/message/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.message_business.get_unread_count(user.get('id'))

    def ActionHuodongMessageMarkReadPost(self, request: Request,
                                          message_id: int = Query(..., description="消息ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        标记消息已读
        POST /api/huodong/message/mark/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.message_business.mark_as_read(user.get('id'), message_id)

    def ActionHuodongMessageMarkAllReadPost(self, request: Request,
                                             authorization: Optional[str] = Header(None)):
        """
        全部标记已读
        POST /api/huodong/message/mark/all/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.message_business.mark_all_read(user.get('id'))

    def ActionHuodongMessageDeletePost(self, request: Request,
                                        message_id: int = Query(..., description="消息ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除消息
        POST /api/huodong/message/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.message_business.delete_message(user.get('id'), message_id)
