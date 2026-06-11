from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.rides import RideBusiness


class RideCreateRequest(BaseModel):
    from_location: str = Field(..., description="出发地")
    to_location: str = Field(..., description="目的地")
    departure_time: str = Field(..., description="出发时间，如 08:30")
    weekdays: bool = Field(default=False, description="是否工作日每天固定")
    seats: int = Field(default=1, ge=1, description="总座位数")
    available_seats: Optional[int] = Field(default=None, ge=0, description="剩余座位数，默认等于总座位数")
    contact: str = Field(..., description="联系方式")
    password: str = Field(..., description="管理密码，用于标记已满或删除")
    remark: str = Field(default='', description="备注信息")


class RidePasswordRequest(BaseModel):
    id: int = Field(..., ge=1, description="拼车信息ID")
    password: str = Field(..., description="管理密码")


class RidesController:
    def __init__(self):
        self.ride_business = RideBusiness()

    def ActionRidesListGet(self, request: Request,
                           from_location: Optional[str] = Query(default=None, description="出发地筛选，模糊匹配"),
                           to_location: Optional[str] = Query(default=None, description="目的地筛选，模糊匹配"),
                           status: Optional[str] = Query(default='active', description="状态筛选: active/full/all")):
        """
        获取拼车列表接口
        GET /api/rides/list/get
        可按出发地、目的地、状态筛选，请求时自动清理24小时前的非工作日过期信息
        """
        search_status = None if status == 'all' else status
        return self.ride_business.search_rides(
            from_location=from_location,
            to_location=to_location,
            status=search_status
        )

    def ActionRidesPublishPost(self, request: Request, body: RideCreateRequest):
        """
        发布拼车信息接口
        POST /api/rides/publish
        提交出发地、目的地、时间、座位数、联系方式和管理密码
        """
        return self.ride_business.create_ride(
            from_location=body.from_location,
            to_location=body.to_location,
            departure_time=body.departure_time,
            weekdays=body.weekdays,
            seats=body.seats,
            available_seats=body.available_seats,
            contact=body.contact,
            password=body.password,
            remark=body.remark
        )

    def ActionRidesItemGet(self, request: Request, id: int = Query(..., ge=1, description="拼车信息ID")):
        """
        获取单条拼车信息接口
        GET /api/rides/item/get
        """
        return self.ride_business.get_ride_by_id(id)

    def ActionRidesFullPost(self, request: Request, body: RidePasswordRequest):
        """
        标记拼车已满接口
        POST /api/rides/full
        需要提供ID和管理密码验证
        """
        return self.ride_business.mark_full(body.id, body.password)

    def ActionRidesActivePost(self, request: Request, body: RidePasswordRequest):
        """
        标记拼车恢复可约接口
        POST /api/rides/active
        需要提供ID和管理密码验证
        """
        return self.ride_business.mark_active(body.id, body.password)

    def ActionRidesDelete(self, request: Request, body: RidePasswordRequest):
        """
        删除拼车信息接口
        DELETE /api/rides/delete
        需要提供ID和管理密码验证
        """
        return self.ride_business.delete_ride(body.id, body.password)

    def ActionRidesCleanPost(self, request: Request,
                             expiry_hours: int = Query(default=24, ge=1, description="过期小时数")):
        """
        清理过期拼车信息接口
        POST /api/rides/clean
        删除指定小时数前的非工作日拼车信息，也可由定时任务调用
        """
        return self.ride_business.clean_expired(expiry_hours)
