from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ReviewUserRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    status: int = Field(..., description="审核状态 1-通过 2-拒绝 3-封禁")


class ProcessComplaintRequest(BaseModel):
    complaint_id: int = Field(..., description="投诉ID")
    status: int = Field(..., description="处理状态 1-已处理 2-已驳回")
    reply: Optional[str] = Field('', description="回复")


class JaoyouAdminController:
    def __init__(self):
        from app.business.jaoyou_077.admin_business import JaoyouAdminBusiness
        from app.business.jaoyou_077.user_business import JaoyouUserBusiness
        from app.business.jaoyou_077.match_business import JaoyouMatchBusiness
        from app.business.jaoyou_077.date_business import JaoyouDateBusiness
        from app.business.jaoyou_077.complaint_business import JaoyouComplaintBusiness
        self.admin_business = JaoyouAdminBusiness()
        self.user_business = JaoyouUserBusiness()
        self.match_business = JaoyouMatchBusiness()
        self.date_business = JaoyouDateBusiness()
        self.complaint_business = JaoyouComplaintBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJaoyouAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionJaoyouAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionJaoyouAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.get_current_admin(token)

    def ActionJaoyouAdminStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_statistics()

    def ActionJaoyouAdminUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      gender: Optional[int] = Query(None, description="性别"),
                                      keyword: Optional[str] = Query(None, description="关键词"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            gender=gender,
            keyword=keyword
        )

    def ActionJaoyouAdminUserReviewPost(self, request: Request, body: ReviewUserRequest,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.review_user(
            user_id=body.user_id,
            status=body.status
        )

    def ActionJaoyouAdminMatchListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.match_business.get_all_matches(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouAdminDateListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.get_all_dates(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouAdminComplaintListGet(self, request: Request, page: int = Query(1, description="页码"),
                                           page_size: int = Query(10, description="每页数量"),
                                           status: Optional[int] = Query(None, description="状态"),
                                           authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_all_complaints(
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouAdminComplaintProcessPost(self, request: Request, body: ProcessComplaintRequest,
                                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.process_complaint(
            complaint_id=body.complaint_id,
            status=body.status,
            reply=body.reply or ''
        )
