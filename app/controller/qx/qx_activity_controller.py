from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateActivityRequest(BaseModel):
    title: str = Field(..., description="活动标题")
    route: Optional[str] = Field(None, description="路线名称")
    distance: Optional[float] = Field(0.0, description="骑行距离")
    elevation: Optional[int] = Field(0, description="累计爬升")
    pace: Optional[str] = Field(None, description="预计均速")
    difficulty: Optional[str] = Field('初级', description="难度等级")
    meeting_time: Optional[str] = Field(None, description="集合时间")
    meeting_point: Optional[str] = Field(None, description="集合地点")
    meeting_lng: Optional[float] = Field(0.0, description="经度")
    meeting_lat: Optional[float] = Field(0.0, description="纬度")
    max_people: Optional[int] = Field(10, description="人数上限")
    cost: Optional[float] = Field(0.0, description="费用")
    description: Optional[str] = Field(None, description="活动描述")


class UpdateActivityRequest(BaseModel):
    title: Optional[str] = Field(None, description="活动标题")
    route: Optional[str] = Field(None, description="路线名称")
    distance: Optional[float] = Field(None, description="骑行距离")
    elevation: Optional[int] = Field(None, description="累计爬升")
    pace: Optional[str] = Field(None, description="预计均速")
    difficulty: Optional[str] = Field(None, description="难度等级")
    meeting_time: Optional[str] = Field(None, description="集合时间")
    meeting_point: Optional[str] = Field(None, description="集合地点")
    meeting_lng: Optional[float] = Field(None, description="经度")
    meeting_lat: Optional[float] = Field(None, description="纬度")
    max_people: Optional[int] = Field(None, description="人数上限")
    cost: Optional[float] = Field(None, description="费用")
    description: Optional[str] = Field(None, description="活动描述")


class QxActivityController:
    def __init__(self):
        from app.business.qx.activity_business import QxActivityBusiness
        from app.business.qx.user_business import QxUserBusiness
        self.activity_business = QxActivityBusiness()
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

    def ActionQxActivityCreatePost(self, request: Request, body: CreateActivityRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建活动接口
        POST /api/qx/activity/create
        用户发布骑行活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.create_activity(
            leader_id=user.get('id'),
            title=body.title,
            route=body.route or '',
            distance=body.distance or 0.0,
            elevation=body.elevation or 0,
            pace=body.pace or '',
            difficulty=body.difficulty or '初级',
            meeting_time=body.meeting_time,
            meeting_point=body.meeting_point or '',
            meeting_lng=body.meeting_lng or 0.0,
            meeting_lat=body.meeting_lat or 0.0,
            max_people=body.max_people or 10,
            cost=body.cost or 0.0,
            description=body.description or ''
        )

    def ActionQxActivityDetailGet(self, request: Request, activity_id: int = Query(..., description="活动ID")):
        """
        获取活动详情接口
        GET /api/qx/activity/detail/get
        根据活动ID获取活动详情
        """
        return self.activity_business.get_activity_by_id(activity_id)

    def ActionQxActivityListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[str] = Query(None, description="状态"),
                                  difficulty: Optional[str] = Query(None, description="难度"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取活动列表接口
        GET /api/qx/activity/list/get
        获取可报名的活动列表
        """
        return self.activity_business.get_activity_list(
            page=page,
            page_size=page_size,
            status=status,
            difficulty=difficulty,
            keyword=keyword
        )

    def ActionQxActivityMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    status: Optional[str] = Query(None, description="状态"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我发布的活动列表接口
        GET /api/qx/activity/my/list/get
        获取当前用户发布的活动列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.get_my_activities(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionQxActivityUpdatePost(self, request: Request, body: UpdateActivityRequest,
                                     activity_id: int = Query(..., description="活动ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新活动接口
        POST /api/qx/activity/update
        更新自己发布的活动信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.route is not None:
            data['route'] = body.route
        if body.distance is not None:
            data['distance'] = body.distance
        if body.elevation is not None:
            data['elevation'] = body.elevation
        if body.pace is not None:
            data['pace'] = body.pace
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.meeting_time is not None:
            data['meeting_time'] = body.meeting_time
        if body.meeting_point is not None:
            data['meeting_point'] = body.meeting_point
        if body.meeting_lng is not None:
            data['meeting_lng'] = body.meeting_lng
        if body.meeting_lat is not None:
            data['meeting_lat'] = body.meeting_lat
        if body.max_people is not None:
            data['max_people'] = body.max_people
        if body.cost is not None:
            data['cost'] = body.cost
        if body.description is not None:
            data['description'] = body.description

        return self.activity_business.update_activity(
            activity_id=activity_id,
            user_id=user.get('id'),
            data=data
        )

    def ActionQxActivityStatusUpdatePost(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                           status: str = Query(..., description="状态"),
                                           authorization: Optional[str] = Header(None)):
        """
        更新活动状态接口
        POST /api/qx/activity/status/update
        更新活动状态（进行中、已结束等）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.update_activity_status(
            activity_id=activity_id,
            status=status
        )

    def ActionQxActivityCheckPost(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                    is_checked: int = Query(..., description="是否审核通过"),
                                    authorization: Optional[str] = Header(None)):
        """
        审核活动接口
        POST /api/qx/activity/check
        管理员审核活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.check_activity(
            activity_id=activity_id,
            is_checked=is_checked
        )

    def ActionQxActivityDeletePost(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除活动接口
        POST /api/qx/activity/delete
        删除自己发布的活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.delete_activity(
            activity_id=activity_id,
            user_id=user.get('id')
        )

    def ActionQxActivityAdminListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[str] = Query(None, description="状态"),
                                       difficulty: Optional[str] = Query(None, description="难度"),
                                       is_checked: Optional[int] = Query(None, description="审核状态"),
                                       keyword: Optional[str] = Query(None, description="搜索关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        管理员获取活动列表接口
        GET /api/qx/activity/admin/list/get
        管理员查看所有活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.get_admin_activity_list(
            page=page,
            page_size=page_size,
            status=status,
            difficulty=difficulty,
            is_checked=is_checked,
            keyword=keyword
        )
