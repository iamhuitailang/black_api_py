from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterActivityRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    remark: Optional[str] = Field('', description="备注")


class HuodongRegistrationController:
    def __init__(self):
        from app.business.huodong.registration_business import RegistrationBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.registration_business = RegistrationBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongRegistrationSignupPost(self, request: Request, body: RegisterActivityRequest,
                                              authorization: Optional[str] = Header(None)):
        """
        活动报名
        POST /api/huodong/registration/signup
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.registration_business.register(
            user_id=user.get('id'),
            activity_id=body.activity_id,
            remark=body.remark or ''
        )

    def ActionHuodongRegistrationCancelPost(self, request: Request,
                                              activity_id: int = Query(..., description="活动ID"),
                                              authorization: Optional[str] = Header(None)):
        """
        取消报名
        POST /api/huodong/registration/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.registration_business.cancel_registration(user.get('id'), activity_id)

    def ActionHuodongRegistrationListGet(self, request: Request,
                                          activity_id: int = Query(..., description="活动ID"),
                                          page: int = Query(1, ge=1),
                                          page_size: int = Query(20, ge=1, le=100)):
        """
        获取活动报名列表
        GET /api/huodong/registration/list/get
        """
        return self.registration_business.get_registrations_by_activity(activity_id, page, page_size)

    def ActionHuodongRegistrationMyListGet(self, request: Request,
                                            page: int = Query(1, ge=1),
                                            page_size: int = Query(10, ge=1, le=100),
                                            status: Optional[int] = Query(None),
                                            authorization: Optional[str] = Header(None)):
        """
        获取我的报名列表
        GET /api/huodong/registration/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.registration_business.get_my_registrations(user.get('id'), page, page_size, status)
