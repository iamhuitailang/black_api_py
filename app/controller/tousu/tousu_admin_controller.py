from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateUserRequest(BaseModel):
    username: str = Field(..., description="用户名")
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    role: Optional[str] = Field('student', description="角色")
    nickname: Optional[str] = Field(None, description="昵称")
    department_id: Optional[int] = Field(0, description="部门ID")


class UpdateUserRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    department_id: Optional[int] = Field(None, description="部门ID")
    status: Optional[int] = Field(None, description="状态")


class CreateAnnouncementRequest(BaseModel):
    title: str = Field(..., description="标题")
    content: str = Field(..., description="内容")


class UpdateAnnouncementRequest(BaseModel):
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="内容")
    status: Optional[int] = Field(None, description="状态")


class TousuAdminController:
    def __init__(self):
        from app.business.tousu.admin_business import TousuAdminBusiness
        self.admin_business = TousuAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.tousu.user_business import TousuUserBusiness
        user_business = TousuUserBusiness()
        return user_business.verify_token(token)

    def ActionTousuAdminUserCreatePost(self, request: Request, body: CreateUserRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        创建用户接口
        POST /api/tousu/admin/user/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.create_user(
            username=body.username,
            phone=body.phone,
            password=body.password,
            role=body.role or 'student',
            nickname=body.nickname or '',
            department_id=body.department_id or 0
        )

    def ActionTousuAdminUserUpdatePost(self, request: Request, body: UpdateUserRequest,
                                       user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        更新用户接口
        POST /api/tousu/admin/user/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        data = {}
        if body.nickname is not None:
            data['nickname'] = body.nickname
        if body.avatar is not None:
            data['avatar'] = body.avatar
        if body.department_id is not None:
            data['department_id'] = body.department_id
        if body.status is not None:
            data['status'] = body.status

        return self.admin_business.update_user(user_id, data)

    def ActionTousuAdminUserDeletePost(self, request: Request,
                                       user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/tousu/admin/user/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.delete_user(user_id)

    def ActionTousuAdminUserListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    role: Optional[str] = Query(None, description="角色"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="关键词"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/tousu/admin/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.get_user_list(page, page_size, role, status, keyword)

    def ActionTousuAdminAnnouncementCreatePost(self, request: Request, body: CreateAnnouncementRequest,
                                               authorization: Optional[str] = Header(None)):
        """
        创建公告接口
        POST /api/tousu/admin/announcement/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.create_announcement(
            title=body.title,
            content=body.content,
            publisher_id=user.get('id')
        )

    def ActionTousuAdminAnnouncementUpdatePost(self, request: Request, body: UpdateAnnouncementRequest,
                                               announcement_id: int = Query(..., description="公告ID"),
                                               authorization: Optional[str] = Header(None)):
        """
        更新公告接口
        POST /api/tousu/admin/announcement/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.content is not None:
            data['content'] = body.content
        if body.status is not None:
            data['status'] = body.status

        return self.admin_business.update_announcement(announcement_id, data)

    def ActionTousuAdminAnnouncementPublishPost(self, request: Request,
                                                announcement_id: int = Query(..., description="公告ID"),
                                                authorization: Optional[str] = Header(None)):
        """
        发布公告接口
        POST /api/tousu/admin/announcement/publish
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.publish_announcement(announcement_id)

    def ActionTousuAdminAnnouncementDeletePost(self, request: Request,
                                               announcement_id: int = Query(..., description="公告ID"),
                                               authorization: Optional[str] = Header(None)):
        """
        删除公告接口
        POST /api/tousu/admin/announcement/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.delete_announcement(announcement_id)

    def ActionTousuAdminAnnouncementListGet(self, request: Request,
                                            page: int = Query(1, description="页码"),
                                            page_size: int = Query(10, description="每页数量"),
                                            status: Optional[int] = Query(None, description="状态"),
                                            keyword: Optional[str] = Query(None, description="关键词"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取公告列表接口
        GET /api/tousu/admin/announcement/list/get
        """
        return self.admin_business.get_announcement_list(page, page_size, status, keyword)

    def ActionTousuAnnouncementPublishedListGet(self, request: Request,
                                                page: int = Query(1, description="页码"),
                                                page_size: int = Query(10, description="每页数量"),
                                                authorization: Optional[str] = Header(None)):
        """
        获取已发布公告列表接口
        GET /api/tousu/announcement/published/list/get
        """
        return self.admin_business.get_published_announcements(page, page_size)

    def ActionTousuNotificationListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       is_read: Optional[int] = Query(None, description="是否已读"),
                                       type: Optional[str] = Query(None, description="类型"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取通知列表接口
        GET /api/tousu/notification/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_notifications(
            user.get('id'), page, page_size, is_read, type
        )

    def ActionTousuNotificationReadPost(self, request: Request,
                                        notification_id: int = Query(..., description="通知ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        标记通知已读接口
        POST /api/tousu/notification/read
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.mark_notification_read(notification_id)

    def ActionTousuNotificationReadAllPost(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        标记所有通知已读接口
        POST /api/tousu/notification/read/all
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.mark_all_notifications_read(user.get('id'))

    def ActionTousuNotificationUnreadCountGet(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        """
        获取未读通知数量接口
        GET /api/tousu/notification/unread/count/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_unread_count(user.get('id'))

    def ActionTousuAdminLogListGet(self, request: Request,
                                   page: int = Query(1, description="页码"),
                                   page_size: int = Query(20, description="每页数量"),
                                   user_id: Optional[int] = Query(None, description="用户ID"),
                                   action: Optional[str] = Query(None, description="操作类型"),
                                   keyword: Optional[str] = Query(None, description="关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取操作日志接口
        GET /api/tousu/admin/log/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.get_logs(page, page_size, user_id, action, keyword)

    def ActionTousuAdminStatisticsGet(self, request: Request,
                                      department_id: Optional[int] = Query(None, description="部门ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取统计数据接口
        GET /api/tousu/admin/statistics/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '权限不足',
                'data': None
            }

        return self.admin_business.get_statistics(department_id)