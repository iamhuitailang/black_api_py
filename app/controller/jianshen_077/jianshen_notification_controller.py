from typing import Optional
from fastapi import Request, Header, Query


class JianshenNotificationController:
    def __init__(self):
        from app.business.jianshen_077.notification_business import NotificationBusiness
        self.notification_business = NotificationBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jianshen_077.auth_business import JianshenAuthBusiness
        return JianshenAuthBusiness().verify_token(token)

    def ActionJianshenNotificationMyListGet(self, request: Request,
                                             page: int = Query(1, ge=1, description="页码"),
                                             page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                             authorization: Optional[str] = Header(None)):
        """
        获取我的通知列表接口
        GET /api/jianshen/notification/my/list/get
        用户查看自己的通知列表
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
            page_size=page_size
        )

    def ActionJianshenNotificationUnreadListGet(self, request: Request,
                                                  page: int = Query(1, ge=1, description="页码"),
                                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                                  authorization: Optional[str] = Header(None)):
        """
        获取未读通知列表接口
        GET /api/jianshen/notification/unread/list/get
        用户查看未读通知
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.notification_business.get_unread_notifications(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionJianshenNotificationUnreadCountGet(self, request: Request,
                                                   authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/jianshen/notification/unread/count/get
        用户获取未读通知数量
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

    def ActionJianshenNotificationReadPost(self, request: Request,
                                            notification_id: int = Query(..., description="通知ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        标记通知已读接口
        POST /api/jianshen/notification/read
        用户标记单条通知为已读
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

    def ActionJianshenNotificationReadAllPost(self, request: Request,
                                               authorization: Optional[str] = Header(None)):
        """
        标记所有通知已读接口
        POST /api/jianshen/notification/read/all
        用户标记所有通知为已读
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

    def ActionJianshenNotificationCourseReminderPost(self, request: Request,
                                                      course_id: int = Query(..., description="课程ID"),
                                                      authorization: Optional[str] = Header(None)):
        """
        发送课程提醒接口
        POST /api/jianshen/notification/course/reminder
        管理员发送课程提醒通知
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.notification_business.send_course_reminder(course_id)

    def ActionJianshenNotificationDeletePost(self, request: Request,
                                              notification_id: int = Query(..., description="通知ID"),
                                              authorization: Optional[str] = Header(None)):
        """
        删除通知接口
        POST /api/jianshen/notification/delete
        用户删除通知
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
