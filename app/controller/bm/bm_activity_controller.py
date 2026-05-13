from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateActivityRequest(BaseModel):
    title: str = Field(..., description="活动标题")
    description: Optional[str] = Field('', description="活动描述")
    cover_image: Optional[str] = Field('', description="封面图片")
    location: str = Field(..., description="活动地点")
    start_time: str = Field(..., description="开始时间")
    end_time: str = Field(..., description="结束时间")
    registration_start: str = Field(..., description="报名开始时间")
    registration_end: str = Field(..., description="报名截止时间")
    total_quota: int = Field(..., description="总名额")
    need_approval: Optional[int] = Field(0, description="是否需要审核")
    tag_ids: Optional[List[int]] = Field(None, description="标签ID列表")


class UpdateActivityRequest(BaseModel):
    title: Optional[str] = Field(None, description="活动标题")
    description: Optional[str] = Field(None, description="活动描述")
    cover_image: Optional[str] = Field(None, description="封面图片")
    location: Optional[str] = Field(None, description="活动地点")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    registration_start: Optional[str] = Field(None, description="报名开始时间")
    registration_end: Optional[str] = Field(None, description="报名截止时间")
    total_quota: Optional[int] = Field(None, description="总名额")
    need_approval: Optional[int] = Field(None, description="是否需要审核")
    status: Optional[int] = Field(None, description="活动状态")


class RegisterActivityRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    real_name: str = Field(..., description="真实姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field('', description="邮箱")
    remark: Optional[str] = Field('', description="备注")


class BmActivityController:
    def __init__(self):
        from app.business.bm.activity_business import BmActivityBusiness
        from app.business.bm.auth_business import BmAuthBusiness
        self.activity_business = BmActivityBusiness()
        self.auth_business = BmAuthBusiness()

    def _get_admin_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('admin_token')
        return token or ''

    def _get_user_token(self, request: Request, authorization: Optional[str] = None) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('user_token')
        return token or ''

    def _get_current_admin(self, token: str):
        return self.auth_business.get_admin_by_token(token)

    def _get_current_user(self, token: str):
        return self.auth_business.get_user_by_token(token)

    def ActionBmActivityCreatePost(self, request: Request, body: CreateActivityRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.create_activity(
            title=body.title,
            description=body.description or '',
            cover_image=body.cover_image or '',
            location=body.location,
            start_time=body.start_time,
            end_time=body.end_time,
            registration_start=body.registration_start,
            registration_end=body.registration_end,
            total_quota=body.total_quota,
            need_approval=body.need_approval or 0,
            created_by=admin.get('id'),
            tag_ids=body.tag_ids
        )

    def ActionBmActivityUpdatePost(self, request: Request, activity_id: int, body: UpdateActivityRequest,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {k: v for k, v in body.dict().items() if v is not None}
        return self.activity_business.update_activity(activity_id, data)

    def ActionBmActivityDeletePost(self, request: Request, activity_id: int,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_admin_token(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.delete_activity(activity_id)

    def ActionBmActivityDetailGet(self, request: Request, activity_id: int = Query(..., description="活动ID")):
        return self.activity_business.get_activity_detail(activity_id)

    def ActionBmActivityListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 keyword: Optional[str] = Query(None, description="关键词")):
        return self.activity_business.get_activity_list(page, page_size, status, keyword)

    def ActionBmActivityRegisterPost(self, request: Request, body: RegisterActivityRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_user_token(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.activity_business.register_activity(
            activity_id=body.activity_id,
            real_name=body.real_name,
            phone=body.phone,
            email=body.email or '',
            remark=body.remark or '',
            user_id=user_id
        )

    def ActionBmActivityCancelRegistrationPost(self, request: Request, registration_id: int,
                                                 authorization: Optional[str] = Header(None)):
        token = self._get_user_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.cancel_registration(registration_id)

    def ActionBmUserRegistrationListGet(self, request: Request, page: int = Query(1, description="页码"),
                                         page_size: int = Query(10, description="每页数量"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_user_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.get_user_registrations(user.get('id'), page, page_size, status)
