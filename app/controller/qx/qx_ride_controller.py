from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateRideRequest(BaseModel):
    activity_id: Optional[int] = Field(0, description="关联活动ID")
    date: Optional[str] = Field(None, description="骑行日期")
    distance: float = Field(..., description="骑行距离（公里）")
    duration: int = Field(..., description="骑行时长（分钟）")
    avg_speed: Optional[float] = Field(0.0, description="平均速度")
    max_speed: Optional[float] = Field(0.0, description="最高速度")
    elevation: Optional[int] = Field(0, description="累计爬升（米）")
    route_name: Optional[str] = Field(None, description="路线名称")
    images: Optional[List[str]] = Field(None, description="照片URL列表")
    notes: Optional[str] = Field(None, description="骑行笔记")


class UpdateRideRequest(BaseModel):
    date: Optional[str] = Field(None, description="骑行日期")
    distance: Optional[float] = Field(None, description="骑行距离")
    duration: Optional[int] = Field(None, description="骑行时长")
    avg_speed: Optional[float] = Field(None, description="平均速度")
    max_speed: Optional[float] = Field(None, description="最高速度")
    elevation: Optional[int] = Field(None, description="累计爬升")
    route_name: Optional[str] = Field(None, description="路线名称")
    images: Optional[List[str]] = Field(None, description="照片URL列表")
    notes: Optional[str] = Field(None, description="骑行笔记")


class QxRideController:
    def __init__(self):
        from app.business.qx.ride_business import QxRideBusiness
        from app.business.qx.user_business import QxUserBusiness
        self.ride_business = QxRideBusiness()
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

    def ActionQxRideCreatePost(self, request: Request, body: CreateRideRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建骑行记录接口
        POST /api/qx/ride/create
        用户记录骑行数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ride_business.create_ride(
            user_id=user.get('id'),
            activity_id=body.activity_id or 0,
            date=body.date,
            distance=body.distance,
            duration=body.duration,
            avg_speed=body.avg_speed or 0.0,
            max_speed=body.max_speed or 0.0,
            elevation=body.elevation or 0,
            route_name=body.route_name or '',
            images=body.images,
            notes=body.notes or ''
        )

    def ActionQxRideDetailGet(self, request: Request, ride_id: int = Query(..., description="记录ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取骑行记录详情接口
        GET /api/qx/ride/detail/get
        根据记录ID获取骑行记录详情
        """
        return self.ride_business.get_ride_by_id(ride_id)

    def ActionQxRideMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                start_date: Optional[str] = Query(None, description="开始日期"),
                                end_date: Optional[str] = Query(None, description="结束日期"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的骑行记录列表接口
        GET /api/qx/ride/my/list/get
        获取当前用户的骑行记录列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ride_business.get_my_rides(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            start_date=start_date,
            end_date=end_date
        )

    def ActionQxRideActivityListGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取活动相关骑行记录接口
        GET /api/qx/ride/activity/list/get
        获取某个活动的所有骑行记录
        """
        return self.ride_business.get_rides_by_activity(activity_id)

    def ActionQxRideUpdatePost(self, request: Request, body: UpdateRideRequest,
                                 ride_id: int = Query(..., description="记录ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新骑行记录接口
        POST /api/qx/ride/update
        更新自己的骑行记录
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
        if body.date is not None:
            data['date'] = body.date
        if body.distance is not None:
            data['distance'] = body.distance
        if body.duration is not None:
            data['duration'] = body.duration
        if body.avg_speed is not None:
            data['avg_speed'] = body.avg_speed
        if body.max_speed is not None:
            data['max_speed'] = body.max_speed
        if body.elevation is not None:
            data['elevation'] = body.elevation
        if body.route_name is not None:
            data['route_name'] = body.route_name
        if body.images is not None:
            data['images'] = body.images
        if body.notes is not None:
            data['notes'] = body.notes

        return self.ride_business.update_ride(
            ride_id=ride_id,
            user_id=user.get('id'),
            data=data
        )

    def ActionQxRideDeletePost(self, request: Request, ride_id: int = Query(..., description="记录ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除骑行记录接口
        POST /api/qx/ride/delete
        删除自己的骑行记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ride_business.delete_ride(
            ride_id=ride_id,
            user_id=user.get('id')
        )

    def ActionQxRideStatisticsGet(self, request: Request, month: Optional[str] = Query(None, description="月份"),
                                    year: Optional[str] = Query(None, description="年份"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取骑行统计接口
        GET /api/qx/ride/statistics/get
        获取用户的骑行统计数据
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ride_business.get_statistics(
            user_id=user.get('id'),
            month=month,
            year=year
        )

    def ActionQxRideMonthlyStatisticsGet(self, request: Request, year: str = Query(..., description="年份"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取月度统计接口
        GET /api/qx/ride/monthly/statistics/get
        获取用户一年中各月的骑行统计
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.ride_business.get_monthly_statistics(
            user_id=user.get('id'),
            year=year
        )

    def ActionQxRidePowerEstimateGet(self, request: Request, speed: float = Query(..., description="速度（km/h）"),
                                       elevation: float = Query(0.0, description="爬升（米）"),
                                       weight: float = Query(70.0, description="体重（kg）")):
        """
        功率估算接口
        GET /api/qx/ride/power/estimate/get
        根据速度、爬升、体重估算功率输出
        """
        return self.ride_business.estimate_power(
            speed=speed,
            elevation=elevation,
            weight=weight
        )
