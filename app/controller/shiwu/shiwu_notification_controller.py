from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ShiwuNotificationController:
    def __init__(self):
        from app.business.shiwu.notification_business import NotificationBusiness
        from app.business.shiwu.user_business import UserBusiness
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

    def ActionShiwuNotificationListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      notification_type: Optional[str] = Query(None, description="通知类型"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的通知列表接口
        GET /api/shiwu/notification/list/get
        分页获取当前用户的通知列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.get_my_notifications(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            notification_type=notification_type
        )

    def ActionShiwuNotificationUnreadCountGet(self, request: Request,
                                               authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/shiwu/notification/unread/count/get
        获取当前用户的未读通知数量
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'unread_count': 0}
            }

        return self.notification_business.get_unread_count(
            user_id=user.get('id')
        )

    def ActionShiwuNotificationReadMarkPost(self, request: Request,
                                            notification_id: int = Query(..., description="通知ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        标记通知已读接口
        POST /api/shiwu/notification/read/mark
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

        return self.notification_business.mark_as_read(
            user_id=user.get('id'),
            notification_id=notification_id
        )

    def ActionShiwuNotificationAllReadPost(self, request: Request,
                                            authorization: Optional[str] = Header(None)):
        """
        标记所有通知已读接口
        POST /api/shiwu/notification/all/read
        标记所有未读通知为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.mark_all_as_read(
            user_id=user.get('id')
        )

    def ActionShiwuNotificationDeletePost(self, request: Request,
                                           notification_id: int = Query(..., description="通知ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        删除通知接口
        POST /api/shiwu/notification/delete
        删除单条通知
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.delete_notification(
            user_id=user.get('id'),
            notification_id=notification_id
        )
