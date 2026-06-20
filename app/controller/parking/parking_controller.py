from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.parking import ParkingSpotBusiness, ParkingApplicationBusiness, ParkingPaymentBusiness


class SpotCreateRequest(BaseModel):
    spot_number: str
    spot_type: str = 'standard'
    location: Optional[str] = None
    monthly_fee: float = 300


class SpotUpdateRequest(BaseModel):
    id: int
    spot_number: Optional[str] = None
    spot_type: Optional[str] = None
    location: Optional[str] = None
    monthly_fee: Optional[float] = None
    status: Optional[str] = None


class ApplicationSubmitRequest(BaseModel):
    car_plate: str
    applicant_name: str
    applicant_phone: str
    applicant_address: Optional[str] = None
    desired_spot_type: str = 'standard'


class ApplicationRejectRequest(BaseModel):
    id: int
    reject_reason: str


class AssignSpotRequest(BaseModel):
    application_id: int
    spot_id: int
    months: int = 1


class MarkPaidRequest(BaseModel):
    id: int
    payment_method: str = 'cash'
    remark: Optional[str] = None


class ParkingController:
    def __init__(self):
        self.spot_business = ParkingSpotBusiness()
        self.application_business = ParkingApplicationBusiness()
        self.payment_business = ParkingPaymentBusiness()

    def ActionParkingSpotGetlist(self, request: Request, page: int = Query(1, ge=1),
                                  page_size: int = Query(10, ge=1, le=100),
                                  status: Optional[str] = Query(None),
                                  spot_type: Optional[str] = Query(None)):
        """
        获取车位列表（分页）
        GET /api/parking/spot/getlist
        """
        result = self.spot_business.get_spot_list(page, page_size, status, spot_type)
        return result

    def ActionParkingSpotGetall(self, request: Request, status: Optional[str] = Query(None),
                                 spot_type: Optional[str] = Query(None)):
        """
        获取所有车位
        GET /api/parking/spot/getall
        """
        result = self.spot_business.get_all_spots(status, spot_type)
        return result

    def ActionParkingSpotGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取车位详情
        GET /api/parking/spot/get
        """
        result = self.spot_business.get_spot_detail(id)
        return result

    def ActionParkingSpotCreatePost(self, request: Request, body: SpotCreateRequest):
        """
        创建车位
        POST /api/parking/spot/create
        """
        result = self.spot_business.create_spot(
            body.spot_number, body.spot_type, body.location, body.monthly_fee
        )
        return result

    def ActionParkingSpotUpdatePost(self, request: Request, body: SpotUpdateRequest):
        """
        更新车位
        POST /api/parking/spot/update
        """
        result = self.spot_business.update_spot(
            body.id, body.spot_number, body.spot_type, body.location, body.monthly_fee, body.status
        )
        return result

    def ActionParkingSpotDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除车位
        DELETE /api/parking/spot/delete
        """
        result = self.spot_business.delete_spot(id)
        return result

    def ActionParkingSpotGetstatistics(self, request: Request):
        """
        获取车位统计
        GET /api/parking/spot/getstatistics
        """
        result = self.spot_business.get_statistics()
        return result

    def ActionParkingApplicationGetlist(self, request: Request, page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100),
                                         status: Optional[str] = Query(None),
                                         keyword: Optional[str] = Query(None)):
        """
        获取申请列表（分页）
        GET /api/parking/application/getlist
        """
        result = self.application_business.get_application_list(page, page_size, status, keyword)
        return result

    def ActionParkingApplicationGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取申请详情
        GET /api/parking/application/get
        """
        result = self.application_business.get_application_detail(id)
        return result

    def ActionParkingApplicationSubmitPost(self, request: Request, body: ApplicationSubmitRequest):
        """
        提交月租申请
        POST /api/parking/application/submit
        """
        result = self.application_business.submit_application(
            body.car_plate, body.applicant_name, body.applicant_phone,
            body.applicant_address, body.desired_spot_type
        )
        return result

    def ActionParkingApplicationApprovePost(self, request: Request, id: int = Query(..., ge=1)):
        """
        审批通过申请
        POST /api/parking/application/approve
        """
        result = self.application_business.approve_application(id)
        return result

    def ActionParkingApplicationRejectPost(self, request: Request, body: ApplicationRejectRequest):
        """
        拒绝申请
        POST /api/parking/application/reject
        """
        result = self.application_business.reject_application(body.id, body.reject_reason)
        return result

    def ActionParkingApplicationAssignspotPost(self, request: Request, body: AssignSpotRequest):
        """
        分配车位
        POST /api/parking/application/assignspot
        """
        result = self.application_business.assign_spot(body.application_id, body.spot_id, body.months)
        return result

    def ActionParkingApplicationGetmy(self, request: Request, phone: str = Query(...)):
        """
        居民查询我的申请
        GET /api/parking/application/getmy
        """
        result = self.application_business.get_my_applications(phone)
        return result

    def ActionParkingApplicationGetstatistics(self, request: Request):
        """
        获取申请统计
        GET /api/parking/application/getstatistics
        """
        result = self.application_business.get_statistics()
        return result

    def ActionParkingPaymentGetlist(self, request: Request, page: int = Query(1, ge=1),
                                     page_size: int = Query(10, ge=1, le=100),
                                     status: Optional[str] = Query(None),
                                     month: Optional[str] = Query(None),
                                     keyword: Optional[str] = Query(None)):
        """
        获取缴费记录列表（分页）
        GET /api/parking/payment/getlist
        """
        result = self.payment_business.get_payment_list(page, page_size, status, month, keyword)
        return result

    def ActionParkingPaymentGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取缴费记录详情
        GET /api/parking/payment/get
        """
        result = self.payment_business.get_payment_detail(id)
        return result

    def ActionParkingPaymentMarkpaidPost(self, request: Request, body: MarkPaidRequest):
        """
        标记已缴费
        POST /api/parking/payment/markpaid
        """
        result = self.payment_business.mark_paid(body.id, body.payment_method, body.remark)
        return result

    def ActionParkingPaymentGetmy(self, request: Request, car_plate: Optional[str] = Query(None),
                                   phone: Optional[str] = Query(None)):
        """
        居民查询我的缴费记录
        GET /api/parking/payment/getmy
        """
        result = self.payment_business.get_my_payments(car_plate, phone)
        return result

    def ActionParkingPaymentGetstatistics(self, request: Request, month: Optional[str] = Query(None)):
        """
        获取缴费统计
        GET /api/parking/payment/getstatistics
        """
        result = self.payment_business.get_statistics(month)
        return result
