from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BaoxiuNotificationController:
    def __init__(self):
        from app.business.baoxiu.notification_business import BaoxiuNotificationBusiness
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.notification_business = BaoxiuNotificationBusiness()
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionBaoxiuNotificationListGet(self, request: Request,
                                         page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         is_read: Optional[int] = Query(None, description="是否已读"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取通知列表接口
        GET /api/baoxiu/notification/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.notification_business.get_notifications(user.get('id'), page, page_size, is_read)

    def ActionBaoxiuNotificationReadPost(self, request: Request,
                                          notification_id: int = Query(..., description="通知ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        标记通知为已读接口
        POST /api/baoxiu/notification/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.notification_business.mark_as_read(notification_id, user.get('id'))

    def ActionBaoxiuNotificationReadAllPost(self, request: Request,
                                             authorization: Optional[str] = Header(None)):
        """
        标记所有通知为已读接口
        POST /api/baoxiu/notification/read/all
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.notification_business.mark_all_as_read(user.get('id'))

    def ActionBaoxiuNotificationUnreadCountGet(self, request: Request,
                                                authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/baoxiu/notification/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.notification_business.get_unread_count(user.get('id'))

    def ActionBaoxiuNotificationDeletePost(self, request: Request,
                                            notification_id: int = Query(..., description="通知ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        删除通知接口
        POST /api/baoxiu/notification/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.notification_business.delete_notification(notification_id, user.get('id'))
