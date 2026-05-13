from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CheckinByQrcodeRequest(BaseModel):
    qrcode: str = Field(..., description="签到码")


class CheckinByIdRequest(BaseModel):
    registration_id: int = Field(..., description="报名记录ID")


class BmAdminController:
    def __init__(self):
        from app.business.bm.admin_business import BmAdminBusiness
        from app.business.bm.auth_business import BmAuthBusiness
        self.admin_business = BmAdminBusiness()
        self.auth_business = BmAuthBusiness()

    def _get_admin_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('admin_token')
        return token or ''

    def _get_current_admin(self, token: str):
        return self.auth_business.get_admin_by_token(token)

    def ActionBmAdminRegistrationListGet(self, request: Request,
                                          activity_id: Optional[int] = Query(None, description="活动ID"),
                                          page: int = Query(1, description="页码"),
                                          page_size: int = Query(10, description="每页数量"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          keyword: Optional[str] = Query(None, description="关键词"),
                                          authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_registration_list(
            activity_id=activity_id,
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionBmAdminRegistrationApprovePost(self, request: Request, registration_id: int,
                                              authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.approve_registration(registration_id)

    def ActionBmAdminRegistrationRejectPost(self, request: Request, registration_id: int,
                                             authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.reject_registration(registration_id)

    def ActionBmAdminCheckinByQrcodePost(self, request: Request, body: CheckinByQrcodeRequest,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.checkin_by_qrcode(
            qrcode=body.qrcode,
            operator_id=admin.get('id'),
            operator_name=admin.get('nickname', '')
        )

    def ActionBmAdminCheckinByIdPost(self, request: Request, body: CheckinByIdRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.checkin_by_registration_id(
            registration_id=body.registration_id,
            operator_id=admin.get('id'),
            operator_name=admin.get('nickname', '')
        )

    def ActionBmAdminActivityStatisticsGet(self, request: Request,
                                             activity_id: int = Query(..., description="活动ID"),
                                             authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_activity_statistics(activity_id)

    def ActionBmAdminCheckinLogsGet(self, request: Request,
                                      registration_id: Optional[int] = Query(None, description="报名记录ID"),
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.get_checkin_logs(registration_id, page, page_size)
