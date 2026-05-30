from typing import Optional, List, Dict, Any
from fastapi import Request, Query
from pydantic import BaseModel, Field
from app.business.chefei import VehicleTypeBusiness, ParkingBusiness


class VehicleEntryRequest(BaseModel):
    plate_number: str = Field(..., description="车牌号")
    vehicle_type_code: str = Field(..., description="车型编码: small-小型车, large-大型车, motorcycle-摩托车, bicycle-自行车")


class VehicleExitRequest(BaseModel):
    record_id: Optional[int] = Field(default=None, description="停车记录ID，与车牌号二选一")
    plate_number: Optional[str] = Field(default=None, description="车牌号，与记录ID二选一")


class FeePreviewRequest(BaseModel):
    record_id: Optional[int] = Field(default=None, description="停车记录ID")
    plate_number: Optional[str] = Field(default=None, description="车牌号")
    vehicle_type_code: Optional[str] = Field(default=None, description="车型编码（用于预计算）")
    entry_time: Optional[str] = Field(default=None, description="入场时间（用于预计算）")


class VehicleTypeAddRequest(BaseModel):
    name: str = Field(..., description="车型名称")
    code: str = Field(..., description="车型编码")
    rate_per_hour: float = Field(..., description="费率（元/小时）")
    free_minutes: int = Field(..., description="免费时长（分钟）")
    daily_cap: float = Field(..., description="单日封顶（元）")
    icon: Optional[str] = Field(default='', description="图标")
    description: Optional[str] = Field(default='', description="描述")
    sort_order: Optional[int] = Field(default=0, description="排序")


class VehicleTypeUpdateRequest(BaseModel):
    id: int = Field(..., description="车型ID")
    name: Optional[str] = Field(default=None, description="车型名称")
    code: Optional[str] = Field(default=None, description="车型编码")
    rate_per_hour: Optional[float] = Field(default=None, description="费率（元/小时）")
    free_minutes: Optional[int] = Field(default=None, description="免费时长（分钟）")
    daily_cap: Optional[float] = Field(default=None, description="单日封顶（元）")
    icon: Optional[str] = Field(default=None, description="图标")
    description: Optional[str] = Field(default=None, description="描述")
    sort_order: Optional[int] = Field(default=None, description="排序")
    is_active: Optional[int] = Field(default=None, description="是否启用")


class RecordUpdateRequest(BaseModel):
    id: int = Field(..., description="记录ID")
    plate_number: Optional[str] = Field(default=None, description="车牌号")
    entry_time: Optional[str] = Field(default=None, description="入场时间")
    exit_time: Optional[str] = Field(default=None, description="出场时间")


class ChefeiController:
    def __init__(self):
        self.vehicle_type_business = VehicleTypeBusiness()
        self.parking_business = ParkingBusiness()

    def ActionChefeiVehicleTypesGet(self, request: Request):
        """
        获取车型列表
        GET /api/chefei/vehicle/types/get
        """
        return self.vehicle_type_business.get_vehicle_types()

    def ActionChefeiVehicleTypeItemGet(self, request: Request, id: int = Query(..., ge=1, description="车型ID")):
        """
        获取单个车型
        GET /api/chefei/vehicle/type/item/get
        """
        return self.vehicle_type_business.get_vehicle_type_by_id(id)

    def ActionChefeiVehicleTypeAddPost(self, request: Request, body: VehicleTypeAddRequest):
        """
        添加车型
        POST /api/chefei/vehicle/type/add
        """
        return self.vehicle_type_business.add_vehicle_type(
            name=body.name,
            code=body.code,
            rate_per_hour=body.rate_per_hour,
            free_minutes=body.free_minutes,
            daily_cap=body.daily_cap,
            icon=body.icon,
            description=body.description,
            sort_order=body.sort_order
        )

    def ActionChefeiVehicleTypeUpdatePost(self, request: Request, body: VehicleTypeUpdateRequest):
        """
        更新车型
        POST /api/chefei/vehicle/type/update
        """
        return self.vehicle_type_business.update_vehicle_type(
            record_id=body.id,
            name=body.name,
            code=body.code,
            rate_per_hour=body.rate_per_hour,
            free_minutes=body.free_minutes,
            daily_cap=body.daily_cap,
            icon=body.icon,
            description=body.description,
            sort_order=body.sort_order,
            is_active=body.is_active
        )

    def ActionChefeiVehicleTypeDelete(self, request: Request, id: int = Query(..., ge=1, description="车型ID")):
        """
        删除车型
        DELETE /api/chefei/vehicle/type/delete
        """
        return self.vehicle_type_business.delete_vehicle_type(id)

    def ActionChefeiParkingEntryPost(self, request: Request, body: VehicleEntryRequest):
        """
        车辆入场
        POST /api/chefei/parking/entry
        """
        return self.parking_business.vehicle_entry(
            plate_number=body.plate_number,
            vehicle_type_code=body.vehicle_type_code
        )

    def ActionChefeiParkingExitPost(self, request: Request, body: VehicleExitRequest):
        """
        车辆出场
        POST /api/chefei/parking/exit
        """
        return self.parking_business.vehicle_exit(
            record_id=body.record_id,
            plate_number=body.plate_number
        )

    def ActionChefeiParkingFeePreviewPost(self, request: Request, body: FeePreviewRequest):
        """
        费用预览计算
        POST /api/chefei/parking/fee/preview
        """
        return self.parking_business.calculate_fee_preview(
            plate_number=body.plate_number,
            record_id=body.record_id,
            vehicle_type_code=body.vehicle_type_code,
            entry_time=body.entry_time
        )

    def ActionChefeiParkingListGet(self, request: Request):
        """
        获取在场车辆列表
        GET /api/chefei/parking/list/get
        """
        return self.parking_business.get_parking_list()

    def ActionChefeiParkingRecordGet(self, request: Request, id: int = Query(..., ge=1, description="记录ID")):
        """
        获取单个停车记录
        GET /api/chefei/parking/record/get
        """
        return self.parking_business.get_record_by_id(id)

    def ActionChefeiParkingRecordUpdatePost(self, request: Request, body: RecordUpdateRequest):
        """
        更新停车记录
        POST /api/chefei/parking/record/update
        """
        return self.parking_business.update_record(
            record_id=body.id,
            plate_number=body.plate_number,
            entry_time=body.entry_time,
            exit_time=body.exit_time
        )

    def ActionChefeiParkingRecordDelete(self, request: Request, id: int = Query(..., ge=1, description="记录ID")):
        """
        删除停车记录
        DELETE /api/chefei/parking/record/delete
        """
        return self.parking_business.delete_record(id)

    def ActionChefeiHistoryListGet(self, request: Request,
                                   start_date: Optional[str] = Query(default=None, description="开始日期"),
                                   end_date: Optional[str] = Query(default=None, description="结束日期"),
                                   plate_number: Optional[str] = Query(default=None, description="车牌号"),
                                   page: int = Query(default=1, ge=1, description="页码"),
                                   page_size: int = Query(default=20, ge=1, le=100, description="每页数量")):
        """
        获取历史记录列表
        GET /api/chefei/history/list/get
        """
        return self.parking_business.get_history_list(
            start_date=start_date,
            end_date=end_date,
            plate_number=plate_number,
            page=page,
            page_size=page_size
        )

    def ActionChefeiStatisticsGet(self, request: Request):
        """
        获取今日统计
        GET /api/chefei/statistics/get
        """
        return self.parking_business.get_statistics()
