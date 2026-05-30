from typing import Optional
from fastapi import Request, Header, Query


class BqMessageController:
    def __init__(self):
        from app.business.biaoqing_model.message_business import BqMessageBusiness
        self.message_business = BqMessageBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.biaoqing_model.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqMessageListGet(self, request: Request, page: int = Query(1, description="页码"),
                                page_size: int = Query(20, description="每页数量"),
                                status: Optional[int] = Query(None, description="状态"),
                                type: Optional[int] = Query(None, description="消息类型"),
                                authorization: Optional[str] = Header(None)):
        """
        获取消息列表接口
        GET /api/bq/message/list/get
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

        return self.message_business.get_list(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            type=type
        )

    def ActionBqMessageDetailGet(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取消息详情接口
        GET /api/bq/message/detail/get
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

        return self.message_business.get_by_id(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionBqMessageUnreadCountGet(self, request: Request,
                                       authorization: Optional[str] = Header(None)):
        """
        获取未读消息数量接口
        GET /api/bq/message/unread/count/get
        获取当前用户的未读消息数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'count': 0}
            }

        return self.message_business.get_unread_count(user.get('id'))

    def ActionBqMessageMarkReadPost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        标记消息已读接口
        POST /api/bq/message/mark/read
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

        return self.message_business.mark_all_read(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionBqMessageMarkAllReadPost(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        标记全部消息已读接口
        POST /api/bq/message/mark/all/read
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

    def ActionBqMessageDeletePost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除消息接口
        POST /api/bq/message/delete
        删除指定消息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.delete(
            message_id=message_id,
            user_id=user.get('id')
        )
