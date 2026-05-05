from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JoinActivityRequest(BaseModel):
    emergency_contact: Optional[str] = Field(None, description="紧急联系人")


class QxRegistrationController:
    def __init__(self):
        from app.business.qx.registration_business import QxRegistrationBusiness
        from app.business.qx.user_business import QxUserBusiness
        self.registration_business = QxRegistrationBusiness()
        self.user_business = QxUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionQxRegistrationJoinPost(self, request: Request, body: JoinActivityRequest,
                                       activity_id: int = Query(..., description="活动ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        报名活动接口
        POST /api/qx/registration/join
        用户报名参加活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.join_activity(
            activity_id=activity_id,
            user_id=user.get('id'),
            emergency_contact=body.emergency_contact or ''
        )

    def ActionQxRegistrationCancelPost(self, request: Request,
                                         activity_id: int = Query(..., description="活动ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        取消报名接口
        POST /api/qx/registration/cancel
        用户取消活动报名
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.cancel_registration(
            activity_id=activity_id,
            user_id=user.get('id')
        )

    def ActionQxRegistrationCheckinPost(self, request: Request,
                                          activity_id: int = Query(..., description="活动ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        签到接口
        POST /api/qx/registration/checkin
        用户活动签到
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.check_in(
            activity_id=activity_id,
            user_id=user.get('id')
        )

    def ActionQxRegistrationMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                        page_size: int = Query(10, description="每页数量"),
                                        status: Optional[str] = Query(None, description="状态"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我报名的活动列表接口
        GET /api/qx/registration/my/list/get
        获取当前用户报名的活动列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.get_my_registrations(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionQxRegistrationMembersGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                         status: Optional[str] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取活动成员列表接口
        GET /api/qx/registration/members/get
        获取活动的报名成员列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.get_activity_members(
            activity_id=activity_id,
            status=status
        )

    def ActionQxRegistrationStatusGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取报名状态接口
        GET /api/qx/registration/status/get
        获取用户对某个活动的报名状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.get_registration_status(
            activity_id=activity_id,
            user_id=user.get('id')
        )
