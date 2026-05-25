from typing import Optional, List, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class AdminUpdateProfileRequest(BaseModel):
    real_name: Optional[str] = Field(None)
    avatar: Optional[str] = Field(None)


class QuoteCreateRequest(BaseModel):
    quote_date: str = Field(..., description="日期")
    content: str = Field(..., description="内容")
    author: Optional[str] = Field(None)


class JianshenAdminController:
    def __init__(self):
        from app.business.jianshen.admin_business import JianshenAdminBusiness
        from app.business.jianshen.user_business import JianshenUserBusiness
        from app.business.jianshen.checkin_business import JianshenCheckinBusiness
        from app.business.jianshen.dashboard_business import JianshenDashboardBusiness
        from app.business.jianshen.daily_quote_business import JianshenDailyQuoteBusiness
        self.admin_business = JianshenAdminBusiness()
        self.user_business = JianshenUserBusiness()
        self.checkin_business = JianshenCheckinBusiness()
        self.dashboard_business = JianshenDashboardBusiness()
        self.quote_business = JianshenDailyQuoteBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJianshenAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.admin_business.login(username=body.username, password=body.password)

    def ActionJianshenAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        return self.admin_business.logout(self._get_token(request, authorization))

    def ActionJianshenAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.get_current_admin(token)

    def ActionJianshenAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJianshenAdminProfileUpdatePost(self, request: Request, body: AdminUpdateProfileRequest,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.real_name is not None:
            data['real_name'] = body.real_name
        if body.avatar is not None:
            data['avatar'] = body.avatar
        return self.admin_business.update_profile(admin_id=admin.get('id'), data=data)

    def ActionJianshenAdminDashboardGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.dashboard_business.get_admin_dashboard()

    def ActionJianshenAdminUserListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       status: Optional[int] = Query(None),
                                       keyword: Optional[str] = Query(None),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_list(page=page, page_size=page_size, status=status, keyword=keyword)

    def ActionJianshenAdminUserDisablePost(self, request: Request, user_id: int = Query(...),
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.disable_user(user_id=user_id)

    def ActionJianshenAdminUserEnablePost(self, request: Request, user_id: int = Query(...),
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.enable_user(user_id=user_id)

    def ActionJianshenAdminUserDeletePost(self, request: Request, user_id: int = Query(...),
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.delete_user(user_id=user_id)

    def ActionJianshenAdminCheckinListGet(self, request: Request,
                                          page: int = Query(1, ge=1),
                                          page_size: int = Query(10, ge=1, le=100),
                                          user_id: Optional[int] = Query(None),
                                          keyword: Optional[str] = Query(None),
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.get_all(page=page, page_size=page_size, user_id=user_id, keyword=keyword)

    def ActionJianshenAdminCheckinDeletePost(self, request: Request, checkin_id: int = Query(...),
                                             authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.checkin_business.delete_by_admin(checkin_id=checkin_id)

    def ActionJianshenAdminQuoteListGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(20, ge=1, le=100),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.quote_business.get_list(page=page, page_size=page_size)

    def ActionJianshenAdminQuoteCreatePost(self, request: Request, body: QuoteCreateRequest,
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.quote_business.create(
            quote_date=body.quote_date,
            content=body.content,
            author=body.author or ''
        )

    def ActionJianshenAdminQuoteDeletePost(self, request: Request, quote_id: int = Query(...),
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token(request, authorization)
        if not self._get_current_admin(token):
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.quote_business.delete(quote_id=quote_id)
