from typing import Optional
from fastapi import Request, Header, Query
from app.business.ershoushu_077_model.notification_business import ErshoushuNotificationBusiness
from app.business.ershoushu_077_model.user_business import ErshoushuUserBusiness


class ErshoushuNotificationController:
    def __init__(self):
        self.notification_business = ErshoushuNotificationBusiness()
        self.user_business = ErshoushuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionErshoushuNotificationListGet(self, request: Request,
                                            page: int = Query(1, ge=1, description="页码"),
                                            page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                            is_read: Optional[int] = Query(None, description="是否已读 0/1"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取通知列表接口
        GET /api/ershoushu/notification/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.get_notifications(user.get('id'), page, page_size, is_read)

    def ActionErshoushuNotificationUnreadCountGet(self, request: Request,
                                                    authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/ershoushu/notification/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.get_unread_count(user.get('id'))

    def ActionErshoushuNotificationReadPost(self, request: Request,
                                             notification_id: int = Query(..., description="通知ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        标记通知已读接口
        POST /api/ershoushu/notification/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.mark_as_read(notification_id, user.get('id'))

    def ActionErshoushuNotificationReadAllPost(self, request: Request,
                                                authorization: Optional[str] = Header(None)):
        """
        标记全部通知已读接口
        POST /api/ershoushu/notification/read/all
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.mark_all_as_read(user.get('id'))
