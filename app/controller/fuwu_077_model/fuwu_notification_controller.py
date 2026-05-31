from typing import Optional
from fastapi import Request, Header, Query


class FuwuNotificationController:
    def __init__(self):
        from app.business.fuwu_077_model.notification_business import NotificationBusiness
        from app.business.fuwu_077_model.auth_business import AuthBusiness
        self.notification_business = NotificationBusiness()
        self.auth_business = AuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionFuwu077ModelNotificationListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态 0未读 1已读"),
                                       notification_type: Optional[str] = Query(None, description="通知类型"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取通知列表接口
        GET /api/fuwu_077_model/notification/list/get
        用户获取自己的通知列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.get_notification_list(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            notification_type=notification_type
        )

    def ActionFuwu077ModelNotificationUnreadCountGet(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/fuwu_077_model/notification/unread_count/get
        获取用户未读通知数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.get_unread_count(user.get('id'))

    def ActionFuwu077ModelNotificationReadPost(self, request: Request,
                                       notification_id: int = Query(..., description="通知ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        标记通知为已读接口
        POST /api/fuwu_077_model/notification/read
        标记单条通知为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.mark_as_read(notification_id, user.get('id'))

    def ActionFuwu077ModelNotificationReadAllPost(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        标记所有通知为已读接口
        POST /api/fuwu_077_model/notification/read_all
        标记用户所有未读通知为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.mark_all_as_read(user.get('id'))

    def ActionFuwu077ModelNotificationDeletePost(self, request: Request,
                                          notification_id: int = Query(..., description="通知ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除通知接口
        POST /api/fuwu_077_model/notification/delete
        用户删除自己的通知
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.delete_notification(notification_id, user.get('id'))
