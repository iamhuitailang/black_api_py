from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateActivityRequest(BaseModel):
    title: str = Field(..., description="活动标题")
    description: Optional[str] = Field('', description="活动描述")
    cover_image: Optional[str] = Field('', description="封面图片")
    content: Optional[str] = Field('', description="活动内容")
    start_time: Optional[str] = Field('', description="开始时间")
    end_time: Optional[str] = Field('', description="结束时间")
    points_reward: Optional[int] = Field(0, description="积分奖励")
    max_participants: Optional[int] = Field(0, description="最大参与人数")


class UpdateActivityRequest(BaseModel):
    title: Optional[str] = Field(None, description="活动标题")
    description: Optional[str] = Field(None, description="活动描述")
    cover_image: Optional[str] = Field(None, description="封面图片")
    content: Optional[str] = Field(None, description="活动内容")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    points_reward: Optional[int] = Field(None, description="积分奖励")
    max_participants: Optional[int] = Field(None, description="最大参与人数")
    status: Optional[int] = Field(None, description="状态")


class RegisterActivityRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    name: Optional[str] = Field('', description="姓名")
    phone: Optional[str] = Field('', description="手机号")
    email: Optional[str] = Field('', description="邮箱")
    extra_info: Optional[str] = Field('', description="额外信息")


class BqActivityController:
    def __init__(self):
        from app.business.biaoqing_model.activity_business import BqActivityBusiness
        self.activity_business = BqActivityBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        if not token:
            return None
        try:
            from app.business.biaoqing_model.user_business import BqUserBusiness
            user_business = BqUserBusiness()
            return user_business.verify_token(token)
        except Exception:
            return None

    def ActionBqActivityCreatePost(self, request: Request, body: CreateActivityRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        创建活动接口（管理员）
        POST /api/bq/activity/create
        创建新的活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.activity_business.create(
            title=body.title,
            description=body.description or '',
            cover_image=body.cover_image or '',
            content=body.content or '',
            start_time=body.start_time or '',
            end_time=body.end_time or '',
            points_reward=body.points_reward or 0,
            max_participants=body.max_participants or 0,
            created_by=user.get('id', 0)
        )

    def ActionBqActivityUpdatePost(self, request: Request, body: UpdateActivityRequest,
                                    activity_id: int = Query(..., description="活动ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新活动接口（管理员）
        POST /api/bq/activity/update
        更新活动信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.cover_image is not None:
            data['cover_image'] = body.cover_image
        if body.content is not None:
            data['content'] = body.content
        if body.start_time is not None:
            data['start_time'] = body.start_time
        if body.end_time is not None:
            data['end_time'] = body.end_time
        if body.points_reward is not None:
            data['points_reward'] = body.points_reward
        if body.max_participants is not None:
            data['max_participants'] = body.max_participants
        if body.status is not None:
            data['status'] = body.status

        return self.activity_business.update(
            activity_id=activity_id,
            data=data
        )

    def ActionBqActivityDeletePost(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除活动接口（管理员）
        POST /api/bq/activity/delete
        删除指定活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.activity_business.delete(activity_id)

    def ActionBqActivityDetailGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取活动详情接口
        GET /api/bq/activity/detail/get
        根据ID获取活动详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.activity_business.get_by_id(
            activity_id=activity_id,
            user_id=user_id
        )

    def ActionBqActivityActiveListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(20, description="每页数量")):
        """
        获取进行中活动列表接口
        GET /api/bq/activity/active/list/get
        分页获取进行中的活动列表
        """
        return self.activity_business.get_active_list(
            page=page,
            page_size=page_size
        )

    def ActionBqActivityListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取活动列表接口
        GET /api/bq/activity/list/get
        分页获取活动列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.activity_business.get_list(
            page=page,
            page_size=page_size,
            status=status,
            user_id=user_id
        )

    def ActionBqActivityRegisterPost(self, request: Request, body: RegisterActivityRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        活动报名接口
        POST /api/bq/activity/register
        报名参加活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.register(
            activity_id=body.activity_id,
            user_id=user.get('id'),
            name=body.name or '',
            phone=body.phone or '',
            email=body.email or '',
            extra_info=body.extra_info or ''
        )

    def ActionBqActivityRegisterCancelPost(self, request: Request, registration_id: int = Query(..., description="报名ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        取消活动报名接口
        POST /api/bq/activity/register/cancel
        取消活动报名
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.cancel_registration(
            registration_id=registration_id,
            user_id=user.get('id')
        )

    def ActionBqActivityRegistrationsGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                          page: int = Query(1, description="页码"),
                                          page_size: int = Query(20, description="每页数量"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          authorization: Optional[str] = Header(None)):
        """
        获取活动报名列表接口（管理员）
        GET /api/bq/activity/registrations/get
        获取指定活动的报名列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.activity_business.get_registrations(
            activity_id=activity_id,
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionBqActivityMyRegistrationsGet(self, request: Request, page: int = Query(1, description="页码"),
                                            page_size: int = Query(20, description="每页数量"),
                                            status: Optional[int] = Query(None, description="状态"),
                                            authorization: Optional[str] = Header(None)):
        """
        获取我的报名记录接口
        GET /api/bq/activity/my/registrations/get
        获取当前用户的活动报名记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.get_user_registrations(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionBqActivityRegistrationStatusUpdatePost(self, request: Request,
                                                      registration_id: int = Query(..., description="报名ID"),
                                                      status: int = Query(..., description="状态"),
                                                      authorization: Optional[str] = Header(None)):
        """
        更新报名状态接口（管理员）
        POST /api/bq/activity/registration/status/update
        更新报名审核状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.activity_business.update_registration_status(
            registration_id=registration_id,
            status=status
        )

    def ActionBqActivityViewCountIncrementPost(self, request: Request, activity_id: int = Query(..., description="活动ID")):
        """
        增加活动浏览量接口
        POST /api/bq/activity/view/count/increment
        增加活动的浏览量
        """
        return self.activity_business.increment_view_count(
            activity_id=activity_id
        )
