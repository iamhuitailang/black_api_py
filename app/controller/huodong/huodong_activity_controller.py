from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateActivityRequest(BaseModel):
    title: str = Field(..., description="活动标题")
    description: Optional[str] = Field('', description="活动描述")
    category: str = Field(..., description="分类代码")
    cover_image: Optional[str] = Field('', description="封面图")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    location_name: Optional[str] = Field('', description="地点名称")
    location_address: Optional[str] = Field('', description="地点地址")
    latitude: Optional[float] = Field(0, description="纬度")
    longitude: Optional[float] = Field(0, description="经度")
    max_participants: Optional[int] = Field(0, description="最大参与人数,0=不限")
    is_free: Optional[int] = Field(1, description="是否免费 1=免费 0=收费")
    fee: Optional[str] = Field('', description="费用说明")
    tags: Optional[str] = Field('', description="标签,逗号分隔")


class UpdateActivityRequest(BaseModel):
    title: Optional[str] = Field(None, description="活动标题")
    description: Optional[str] = Field(None, description="活动描述")
    category: Optional[str] = Field(None, description="分类代码")
    cover_image: Optional[str] = Field(None, description="封面图")
    start_time: Optional[str] = Field(None, description="开始时间")
    end_time: Optional[str] = Field(None, description="结束时间")
    location_name: Optional[str] = Field(None, description="地点名称")
    location_address: Optional[str] = Field(None, description="地点地址")
    latitude: Optional[float] = Field(None, description="纬度")
    longitude: Optional[float] = Field(None, description="经度")
    max_participants: Optional[int] = Field(None, description="最大参与人数")
    is_free: Optional[int] = Field(None, description="是否免费")
    fee: Optional[str] = Field(None, description="费用说明")
    tags: Optional[str] = Field(None, description="标签")


class HuodongActivityController:
    def __init__(self):
        from app.business.huodong.activity_business import ActivityBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.activity_business = ActivityBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongActivityCreatePost(self, request: Request, body: CreateActivityRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        发布活动
        POST /api/huodong/activity/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.activity_business.create_activity(
            user_id=user.get('id'),
            title=body.title,
            description=body.description or '',
            category=body.category,
            cover_image=body.cover_image or '',
            start_time=body.start_time,
            end_time=body.end_time,
            location_name=body.location_name or '',
            location_address=body.location_address or '',
            latitude=body.latitude or 0,
            longitude=body.longitude or 0,
            max_participants=body.max_participants or 0,
            is_free=body.is_free if body.is_free is not None else 1,
            fee=body.fee or '',
            tags=body.tags or ''
        )

    def ActionHuodongActivityDetailGet(self, request: Request,
                                         activity_id: int = Query(..., description="活动ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取活动详情
        GET /api/huodong/activity/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        viewer_user_id = user.get('id') if user else None
        return self.activity_business.get_activity_detail(activity_id, viewer_user_id)

    def ActionHuodongActivityListGet(self, request: Request,
                                      page: int = Query(1, ge=1),
                                      page_size: int = Query(10, ge=1, le=100),
                                      category: Optional[str] = Query(None, description="分类代码"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      city: Optional[str] = Query(None, description="城市"),
                                      order_by: str = Query('created_at DESC', description="排序")):
        """
        获取活动列表
        GET /api/huodong/activity/list/get
        """
        return self.activity_business.get_activity_list(
            page=page, page_size=page_size, category=category,
            status=status, keyword=keyword, city=city, order_by=order_by
        )

    def ActionHuodongActivityFeaturedGet(self, request: Request,
                                           limit: int = Query(5, ge=1, le=20, description="数量")):
        """
        获取热门推荐活动
        GET /api/huodong/activity/featured/get
        """
        return self.activity_business.get_featured_activities(limit)

    def ActionHuodongActivityNearbyGet(self, request: Request,
                                        latitude: float = Query(..., description="纬度"),
                                        longitude: float = Query(..., description="经度"),
                                        radius_km: float = Query(10, ge=1, le=100, description="半径(km)"),
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100)):
        """
        获取附近活动
        GET /api/huodong/activity/nearby/get
        """
        return self.activity_business.get_nearby_activities(latitude, longitude, radius_km, page, page_size)

    def ActionHuodongActivityMyListGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100),
                                        status: Optional[int] = Query(None),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我发布的活动
        GET /api/huodong/activity/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.activity_business.get_my_activities(user.get('id'), page, page_size, status)

    def ActionHuodongActivityUpdatePost(self, request: Request, body: UpdateActivityRequest,
                                          activity_id: int = Query(..., description="活动ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        更新活动
        POST /api/huodong/activity/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.category is not None:
            data['category'] = body.category
        if body.cover_image is not None:
            data['cover_image'] = body.cover_image
        if body.start_time is not None:
            data['start_time'] = body.start_time
        if body.end_time is not None:
            data['end_time'] = body.end_time
        if body.location_name is not None:
            data['location_name'] = body.location_name
        if body.location_address is not None:
            data['location_address'] = body.location_address
        if body.latitude is not None:
            data['latitude'] = body.latitude
        if body.longitude is not None:
            data['longitude'] = body.longitude
        if body.max_participants is not None:
            data['max_participants'] = body.max_participants
        if body.is_free is not None:
            data['is_free'] = body.is_free
        if body.fee is not None:
            data['fee'] = body.fee
        if body.tags is not None:
            data['tags'] = body.tags
        return self.activity_business.update_activity(user.get('id'), activity_id, data)

    def ActionHuodongActivityDeletePost(self, request: Request,
                                          activity_id: int = Query(..., description="活动ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除活动
        POST /api/huodong/activity/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.activity_business.delete_activity(user.get('id'), activity_id)

    def ActionHuodongActivityCategoriesGet(self, request: Request):
        """
        获取分类列表
        GET /api/huodong/activity/categories/get
        """
        return self.activity_business.get_categories()

    def ActionHuodongActivityAdminListGet(self, request: Request,
                                           page: int = Query(1, ge=1),
                                           page_size: int = Query(10, ge=1, le=100),
                                           category: Optional[str] = Query(None),
                                           status: Optional[int] = Query(None),
                                           is_checked: Optional[int] = Query(None),
                                           keyword: Optional[str] = Query(None)):
        """
        管理端活动列表
        GET /api/huodong/activity/admin/list/get
        """
        return self.activity_business.get_admin_activity_list(
            page, page_size, category, status, is_checked, keyword
        )

    def ActionHuodongActivityCheckPost(self, request: Request,
                                        activity_id: int = Query(..., description="活动ID"),
                                        is_checked: int = Query(..., description="审核状态 0/1")):
        """
        审核活动
        POST /api/huodong/activity/check
        """
        return self.activity_business.check_activity(activity_id, is_checked)
