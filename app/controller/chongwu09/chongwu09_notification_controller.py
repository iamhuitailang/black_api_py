from typing import Optional
from fastapi import Request, Header, Query


class Chongwu09NotificationController:
    def __init__(self):
        from app.business.chongwu09.notification_business import NotificationBusiness
        from app.business.chongwu09.user_business import UserBusiness
        self.notification_business = NotificationBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionChongwu09NotificationListGet(self, request: Request,
                                            page: int = Query(1, ge=1),
                                            page_size: int = Query(10, ge=1, le=100),
                                            authorization: Optional[str] = Header(None)):
        """
        获取通知列表
        GET /api/chongwu09/notification/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.get_notifications(user.get('id'), page, page_size)

    def ActionChongwu09NotificationUnreadCountGet(self, request: Request,
                                                    authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量
        GET /api/chongwu09/notification/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.get_unread_count(user.get('id'))

    def ActionChongwu09NotificationReadPost(self, request: Request,
                                              notification_id: int = Query(..., description="通知ID"),
                                              authorization: Optional[str] = Header(None)):
        """
        标记通知已读
        POST /api/chongwu09/notification/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.mark_as_read(notification_id, user.get('id'))

    def ActionChongwu09NotificationReadAllPost(self, request: Request,
                                                 authorization: Optional[str] = Header(None)):
        """
        全部标记已读
        POST /api/chongwu09/notification/read/all
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.mark_all_read(user.get('id'))

    def ActionChongwu09NotificationDeletePost(self, request: Request,
                                                notification_id: int = Query(..., description="通知ID"),
                                                authorization: Optional[str] = Header(None)):
        """
        删除通知
        POST /api/chongwu09/notification/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.notification_business.delete_notification(notification_id, user.get('id'))
